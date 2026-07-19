begin;

create schema if not exists imba;

revoke all on schema imba from public;

create or replace function imba.is_uuid_v4(value uuid)
returns boolean
language sql
immutable
strict
parallel safe
as $$
  select
    (get_byte(uuid_send(value), 6) >> 4) = 4
    and (get_byte(uuid_send(value), 8) & 192) = 128;
$$;

create table imba.event_ledger (
  ledger_position bigint generated always as identity,
  event_id uuid not null,
  stream_id uuid not null,
  stream_type text not null,
  stream_version bigint not null,
  event_type text not null,
  schema_version integer not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  causation_id uuid,
  actor_id uuid,
  pii_context_id uuid,
  payload jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  constraint event_ledger_pkey primary key (ledger_position),
  constraint event_ledger_event_id_key unique (event_id),
  constraint event_ledger_event_position_key unique (event_id, ledger_position),
  constraint event_ledger_stream_version_key unique (stream_id, stream_version),
  constraint event_ledger_event_id_v4 check (imba.is_uuid_v4(event_id)),
  constraint event_ledger_stream_id_v4 check (imba.is_uuid_v4(stream_id)),
  constraint event_ledger_correlation_id_v4 check (imba.is_uuid_v4(correlation_id)),
  constraint event_ledger_causation_id_v4 check (causation_id is null or imba.is_uuid_v4(causation_id)),
  constraint event_ledger_stream_version_positive check (stream_version > 0),
  constraint event_ledger_schema_version_positive check (schema_version > 0),
  constraint event_ledger_stream_type_format check (stream_type ~ '^[a-z][a-z0-9._-]*$'),
  constraint event_ledger_event_type_format check (event_type ~ '^[A-Z][A-Za-z0-9]+$'),
  constraint event_ledger_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint event_ledger_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table imba.event_ledger is
  'Immutable domain-event ledger. PII must be represented by encrypted references, never searchable plaintext payload fields.';

create index event_ledger_stream_position_idx
  on imba.event_ledger (stream_id, ledger_position);

create index event_ledger_type_position_idx
  on imba.event_ledger (event_type, ledger_position);

create index event_ledger_correlation_position_idx
  on imba.event_ledger (correlation_id, ledger_position);

create index event_ledger_causation_idx
  on imba.event_ledger (causation_id)
  where causation_id is not null;

create or replace function imba.reject_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'event ledger rows are immutable; attempted % at ledger position %', tg_op, old.ledger_position
    using errcode = '55000';
end;
$$;

create trigger event_ledger_is_append_only
before update or delete on imba.event_ledger
for each row execute function imba.reject_event_mutation();

create or replace function imba.append_event(
  p_event_id uuid,
  p_stream_id uuid,
  p_stream_type text,
  p_expected_stream_version bigint,
  p_event_type text,
  p_schema_version integer,
  p_occurred_at timestamptz,
  p_correlation_id uuid,
  p_causation_id uuid,
  p_actor_id uuid,
  p_pii_context_id uuid,
  p_payload jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns imba.event_ledger
language plpgsql
security invoker
set search_path = pg_catalog, imba
as $$
declare
  current_version bigint;
  appended imba.event_ledger;
begin
  if p_expected_stream_version < 0 then
    raise exception 'expected stream version cannot be negative'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_stream_id::text, 0));

  select coalesce(max(stream_version), 0)
    into current_version
    from imba.event_ledger
   where stream_id = p_stream_id;

  if current_version <> p_expected_stream_version then
    raise exception 'stream version conflict for %: expected %, actual %',
      p_stream_id, p_expected_stream_version, current_version
      using errcode = '40001';
  end if;

  insert into imba.event_ledger (
    event_id, stream_id, stream_type, stream_version, event_type,
    schema_version, occurred_at, correlation_id, causation_id,
    actor_id, pii_context_id, payload, metadata
  ) values (
    p_event_id, p_stream_id, p_stream_type, p_expected_stream_version + 1,
    p_event_type, p_schema_version, p_occurred_at, p_correlation_id,
    p_causation_id, p_actor_id, p_pii_context_id, p_payload, p_metadata
  )
  returning * into appended;

  return appended;
end;
$$;

create table imba.command_results (
  command_id uuid primary key,
  command_type text not null,
  status text not null,
  correlation_id uuid not null,
  resulting_event_ids uuid[] not null default '{}',
  rejection_code text,
  recorded_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  constraint command_results_command_id_v4 check (imba.is_uuid_v4(command_id)),
  constraint command_results_status check (status in ('RECEIVED', 'SUCCEEDED', 'REJECTED')),
  constraint command_results_result_consistency check (
    (status = 'SUCCEEDED' and cardinality(resulting_event_ids) > 0 and rejection_code is null)
    or (status = 'REJECTED' and cardinality(resulting_event_ids) = 0 and rejection_code is not null)
    or status = 'RECEIVED'
  )
);

create index command_results_correlation_idx
  on imba.command_results (correlation_id, recorded_at);

create table imba.ingestion_quarantine (
  quarantine_id bigint generated always as identity primary key,
  command_id uuid,
  source text not null,
  command_type text,
  reason_code text not null,
  evidence_reference text,
  received_at timestamptz not null default clock_timestamp(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  resolution text,
  constraint ingestion_quarantine_command_id_v4 check (command_id is null or imba.is_uuid_v4(command_id))
);

create index ingestion_quarantine_open_idx
  on imba.ingestion_quarantine (received_at)
  where reviewed_at is null;

create table imba.projection_definitions (
  projection_name text not null,
  projection_version integer not null,
  projection_class text not null,
  storage_relation regclass not null,
  status text not null default 'BUILDING',
  created_at timestamptz not null default clock_timestamp(),
  activated_at timestamptz,
  constraint projection_definitions_pkey primary key (projection_name, projection_version),
  constraint projection_definitions_version_positive check (projection_version > 0),
  constraint projection_definitions_class check (projection_class in ('SYNCHRONOUS_CORE', 'ASYNCHRONOUS')),
  constraint projection_definitions_status check (status in ('BUILDING', 'VALIDATING', 'ACTIVE', 'RETIRED', 'FAILED'))
);

create table imba.projection_checkpoints (
  projection_name text not null,
  projection_version integer not null,
  last_ledger_position bigint not null default 0,
  event_count bigint not null default 0,
  updated_at timestamptz not null default clock_timestamp(),
  failure_code text,
  constraint projection_checkpoints_pkey primary key (projection_name, projection_version),
  constraint projection_checkpoints_definition_fkey foreign key (projection_name, projection_version)
    references imba.projection_definitions (projection_name, projection_version),
  constraint projection_checkpoints_position_nonnegative check (last_ledger_position >= 0),
  constraint projection_checkpoints_event_count_nonnegative check (event_count >= 0)
);

create table imba.projection_routes (
  projection_name text primary key,
  active_projection_version integer not null,
  prior_projection_version integer,
  switched_at timestamptz not null default clock_timestamp(),
  switched_by uuid not null,
  validation_reference text not null,
  constraint projection_routes_active_fkey foreign key (projection_name, active_projection_version)
    references imba.projection_definitions (projection_name, projection_version),
  constraint projection_routes_prior_fkey foreign key (projection_name, prior_projection_version)
    references imba.projection_definitions (projection_name, projection_version),
  constraint projection_routes_different_versions check (
    prior_projection_version is null or prior_projection_version <> active_projection_version
  )
);

create table imba.outbox_messages (
  outbox_id bigint generated always as identity primary key,
  event_id uuid not null,
  ledger_position bigint not null,
  destination text not null,
  message_type text not null,
  idempotency_key text not null,
  payload jsonb not null,
  status text not null default 'PENDING',
  attempt_count integer not null default 0,
  available_at timestamptz not null default clock_timestamp(),
  claimed_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default clock_timestamp(),
  constraint outbox_messages_event_position_fkey foreign key (event_id, ledger_position)
    references imba.event_ledger (event_id, ledger_position),
  constraint outbox_messages_idempotency_key unique (destination, idempotency_key),
  constraint outbox_messages_status check (status in ('PENDING', 'PROCESSING', 'RETRY', 'COMPLETED', 'REVIEW_REQUIRED')),
  constraint outbox_messages_attempt_nonnegative check (attempt_count >= 0),
  constraint outbox_messages_payload_object check (jsonb_typeof(payload) = 'object')
);

create index outbox_messages_event_id_idx on imba.outbox_messages (event_id);
create index outbox_messages_ledger_position_idx on imba.outbox_messages (ledger_position);
create index outbox_messages_ready_idx
  on imba.outbox_messages (available_at, outbox_id)
  where status in ('PENDING', 'RETRY');

create table imba.provider_inbound_decisions (
  decision_id uuid primary key,
  provider text not null,
  provider_event_id text not null,
  source text not null,
  evidence_reference text not null,
  provider_occurred_at timestamptz,
  received_at timestamptz not null default clock_timestamp(),
  policy_id text not null,
  policy_version integer not null,
  outcome text not null,
  explanation_code text not null,
  resulting_event_ids uuid[] not null default '{}',
  decided_at timestamptz not null default clock_timestamp(),
  constraint provider_inbound_decisions_id_v4 check (imba.is_uuid_v4(decision_id)),
  constraint provider_inbound_decisions_provider_event_key unique (provider, provider_event_id),
  constraint provider_inbound_decisions_policy_version_positive check (policy_version > 0),
  constraint provider_inbound_decisions_outcome check (outcome in (
    'AUTO_ACCEPT', 'ACCEPT_AS_ADDITIONAL_VALUE', 'REQUIRE_VERIFICATION',
    'REQUIRE_REVIEW', 'REJECT', 'TELEMETRY_ONLY'
  ))
);

create table imba.pii_encryption_contexts (
  pii_context_id uuid primary key,
  external_key_reference text not null unique,
  cryptographic_purpose text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default clock_timestamp(),
  rotated_at timestamptz,
  destroyed_at timestamptz,
  legal_hold_reference text,
  constraint pii_encryption_contexts_id_v4 check (imba.is_uuid_v4(pii_context_id)),
  constraint pii_encryption_contexts_status check (status in ('ACTIVE', 'ROTATED', 'DESTROYED', 'LEGAL_HOLD')),
  constraint pii_encryption_contexts_destroyed_consistency check (
    (status = 'DESTROYED' and destroyed_at is not null)
    or (status <> 'DESTROYED' and destroyed_at is null)
  )
);

create table imba.pii_erasure_requests (
  erasure_request_id uuid primary key,
  pii_context_id uuid not null references imba.pii_encryption_contexts (pii_context_id),
  policy_id text not null,
  policy_version integer not null,
  status text not null default 'REQUESTED',
  requested_at timestamptz not null default clock_timestamp(),
  approved_at timestamptz,
  completed_at timestamptz,
  evidence_reference text,
  legal_hold_reference text,
  constraint pii_erasure_requests_id_v4 check (imba.is_uuid_v4(erasure_request_id)),
  constraint pii_erasure_requests_policy_version_positive check (policy_version > 0),
  constraint pii_erasure_requests_status check (status in ('REQUESTED', 'VERIFYING', 'LEGAL_HOLD', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'))
);

alter table imba.event_ledger
  add constraint event_ledger_pii_context_fkey
  foreign key (pii_context_id) references imba.pii_encryption_contexts (pii_context_id);

create index pii_erasure_requests_context_idx on imba.pii_erasure_requests (pii_context_id, requested_at);
create index pii_erasure_requests_open_idx
  on imba.pii_erasure_requests (requested_at)
  where status not in ('COMPLETED', 'REJECTED');

create table imba.pii_provider_deletions (
  erasure_request_id uuid not null references imba.pii_erasure_requests (erasure_request_id),
  provider text not null,
  status text not null default 'PENDING',
  requested_at timestamptz,
  acknowledged_at timestamptz,
  evidence_reference text,
  last_error_code text,
  constraint pii_provider_deletions_pkey primary key (erasure_request_id, provider),
  constraint pii_provider_deletions_status check (status in ('PENDING', 'REQUESTED', 'ACKNOWLEDGED', 'NOT_APPLICABLE', 'REVIEW_REQUIRED'))
);

create table imba.accounting_packets (
  accounting_packet_id uuid primary key,
  organization_id uuid not null,
  chapter_id uuid,
  correlation_id uuid not null,
  causation_id uuid,
  policy_id text not null,
  policy_version integer not null,
  effective_date date not null,
  currency_code text not null,
  restriction_dimensions jsonb not null default '{}'::jsonb,
  chapter_dimensions jsonb not null default '{}'::jsonb,
  reversal_of_packet_id uuid references imba.accounting_packets (accounting_packet_id),
  approval_status text not null default 'PROPOSED',
  qbo_posting_reference text,
  created_at timestamptz not null default clock_timestamp(),
  approved_at timestamptz,
  posted_at timestamptz,
  constraint accounting_packets_id_v4 check (imba.is_uuid_v4(accounting_packet_id)),
  constraint accounting_packets_policy_version_positive check (policy_version > 0),
  constraint accounting_packets_currency_format check (currency_code ~ '^[A-Z]{3}$'),
  constraint accounting_packets_restriction_object check (jsonb_typeof(restriction_dimensions) = 'object'),
  constraint accounting_packets_chapter_object check (jsonb_typeof(chapter_dimensions) = 'object'),
  constraint accounting_packets_approval_status check (approval_status in ('PROPOSED', 'REVIEW_REQUIRED', 'APPROVED', 'RELEASED', 'POSTED', 'REVERSED')),
  constraint accounting_packets_not_self_reversal check (reversal_of_packet_id is null or reversal_of_packet_id <> accounting_packet_id)
);

create index accounting_packets_correlation_idx on imba.accounting_packets (correlation_id, created_at);
create index accounting_packets_reversal_idx
  on imba.accounting_packets (reversal_of_packet_id)
  where reversal_of_packet_id is not null;

create table imba.accounting_packet_sources (
  accounting_packet_id uuid not null references imba.accounting_packets (accounting_packet_id),
  source_event_id uuid not null references imba.event_ledger (event_id),
  constraint accounting_packet_sources_pkey primary key (accounting_packet_id, source_event_id)
);

create index accounting_packet_sources_event_idx on imba.accounting_packet_sources (source_event_id);

create table imba.accounting_packet_lines (
  accounting_packet_id uuid not null references imba.accounting_packets (accounting_packet_id),
  line_number integer not null,
  account_reference text not null,
  side text not null,
  minor_units bigint not null,
  currency_code text not null,
  memo text,
  dimensions jsonb not null default '{}'::jsonb,
  constraint accounting_packet_lines_pkey primary key (accounting_packet_id, line_number),
  constraint accounting_packet_lines_line_positive check (line_number > 0),
  constraint accounting_packet_lines_side check (side in ('DEBIT', 'CREDIT')),
  constraint accounting_packet_lines_amount_positive check (minor_units > 0),
  constraint accounting_packet_lines_currency_format check (currency_code ~ '^[A-Z]{3}$'),
  constraint accounting_packet_lines_dimensions_object check (jsonb_typeof(dimensions) = 'object')
);

create or replace function imba.guard_accounting_packet_lines()
returns trigger
language plpgsql
as $$
declare
  packet_status text;
begin
  select approval_status into packet_status
    from imba.accounting_packets
   where accounting_packet_id = coalesce(new.accounting_packet_id, old.accounting_packet_id)
   for update;

  if packet_status not in ('PROPOSED', 'REVIEW_REQUIRED') then
    raise exception 'accounting packet lines are immutable after approval'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger accounting_packet_lines_preapproval_only
before insert or update or delete on imba.accounting_packet_lines
for each row execute function imba.guard_accounting_packet_lines();

create or replace function imba.validate_accounting_packet_release()
returns trigger
language plpgsql
as $$
declare
  debit_total numeric;
  credit_total numeric;
  line_count bigint;
  source_count bigint;
  inconsistent_currency boolean;
begin
  if new.approval_status in ('APPROVED', 'RELEASED', 'POSTED', 'REVERSED')
     and old.approval_status is distinct from new.approval_status then
    select
      coalesce(sum(minor_units) filter (where side = 'DEBIT'), 0),
      coalesce(sum(minor_units) filter (where side = 'CREDIT'), 0),
      count(*),
      bool_or(currency_code <> new.currency_code)
    into debit_total, credit_total, line_count, inconsistent_currency
    from imba.accounting_packet_lines
    where accounting_packet_id = new.accounting_packet_id;

    select count(*) into source_count
    from imba.accounting_packet_sources
    where accounting_packet_id = new.accounting_packet_id;

    if line_count < 2 or source_count = 0 or debit_total <> credit_total or coalesce(inconsistent_currency, false) then
      raise exception 'accounting packet % cannot be released: sources %, lines %, debits %, credits %, currency mismatch %',
        new.accounting_packet_id, source_count, line_count, debit_total, credit_total,
        coalesce(inconsistent_currency, false)
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger accounting_packet_release_requires_balance
before update of approval_status on imba.accounting_packets
for each row execute function imba.validate_accounting_packet_release();

revoke all on all tables in schema imba from public;
revoke all on all functions in schema imba from public;
revoke all on all sequences in schema imba from public;

comment on function imba.append_event is
  'Append with optimistic concurrency. Caller must include this call, synchronous projections, command result, and outbox writes in one transaction.';

commit;
