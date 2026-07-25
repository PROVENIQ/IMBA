begin;

-- This forward migration intentionally refuses to synthesize tenant or trace data for
-- previously recorded events. A populated deployment must first run an explicit,
-- reviewed tenancy backfill.
do $$
begin
  if exists (select 1 from imba.event_ledger limit 1) then
    raise exception '0002 requires an empty event ledger or a separately reviewed tenancy backfill';
  end if;
end;
$$;

alter table imba.event_ledger rename column event_type to event_name;
alter table imba.event_ledger rename column metadata to source_metadata;
alter table imba.event_ledger
  drop constraint event_ledger_event_type_format,
  drop constraint event_ledger_metadata_object,
  add column event_version integer not null default 1,
  add column organization_id uuid not null,
  add column chapter_scope text not null,
  add column chapter_id uuid,
  add column ingested_at timestamptz not null default clock_timestamp(),
  add column actor_type text not null,
  add column actor_role text not null,
  add column source_system text not null,
  add constraint event_ledger_event_name_format
    check (event_name ~ '^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$'),
  add constraint event_ledger_event_version_positive check (event_version > 0),
  add constraint event_ledger_organization_id_v4 check (imba.is_uuid_v4(organization_id)),
  add constraint event_ledger_chapter_id_v4 check (chapter_id is null or imba.is_uuid_v4(chapter_id)),
  add constraint event_ledger_chapter_scope check (
    (chapter_scope = 'NATIONAL' and chapter_id is null)
    or (chapter_scope = 'CHAPTER' and chapter_id is not null)
  ),
  add constraint event_ledger_actor_type check (actor_type in ('USER', 'SYSTEM', 'PROVIDER')),
  add constraint event_ledger_source_metadata_object check (jsonb_typeof(source_metadata) = 'object');

alter table imba.event_ledger
  alter column event_version drop default,
  alter column actor_id set not null,
  alter column causation_id set not null;

drop index imba.event_ledger_type_position_idx;
create index event_ledger_organization_position_idx
  on imba.event_ledger (organization_id, ledger_position);
create index event_ledger_organization_event_position_idx
  on imba.event_ledger (organization_id, event_name, ledger_position);
create index event_ledger_chapter_position_idx
  on imba.event_ledger (organization_id, chapter_id, ledger_position)
  where chapter_id is not null;

drop function imba.append_event(
  uuid, uuid, text, bigint, text, integer, timestamptz, uuid, uuid, uuid, uuid, jsonb, jsonb
);

create function imba.append_event(
  p_event_id uuid,
  p_stream_id uuid,
  p_stream_type text,
  p_expected_stream_version bigint,
  p_event_name text,
  p_event_version integer,
  p_schema_version integer,
  p_organization_id uuid,
  p_chapter_scope text,
  p_chapter_id uuid,
  p_occurred_at timestamptz,
  p_correlation_id uuid,
  p_causation_id uuid,
  p_actor_id uuid,
  p_actor_type text,
  p_actor_role text,
  p_source_system text,
  p_pii_context_id uuid,
  p_payload jsonb,
  p_source_metadata jsonb default '{}'::jsonb
)
returns imba.event_ledger
language plpgsql
security invoker
set search_path = pg_catalog, imba
as $$
declare
  current_version bigint;
  server_ingested_at timestamptz := clock_timestamp();
  appended imba.event_ledger;
begin
  if p_expected_stream_version < 0 then
    raise exception 'expected stream version cannot be negative' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_stream_id::text, 0));
  select coalesce(max(stream_version), 0)
    into current_version
    from imba.event_ledger
   where stream_id = p_stream_id
     and organization_id = p_organization_id;

  if current_version <> p_expected_stream_version then
    raise exception 'stream version conflict for %: expected %, actual %',
      p_stream_id, p_expected_stream_version, current_version using errcode = '40001';
  end if;

  insert into imba.event_ledger (
    event_id, stream_id, stream_type, stream_version, event_name, event_version,
    schema_version, organization_id, chapter_scope, chapter_id, occurred_at,
    ingested_at, recorded_at, correlation_id, causation_id, actor_id, actor_type,
    actor_role, source_system, pii_context_id, payload, source_metadata
  ) values (
    p_event_id, p_stream_id, p_stream_type, p_expected_stream_version + 1,
    p_event_name, p_event_version, p_schema_version, p_organization_id,
    p_chapter_scope, p_chapter_id, p_occurred_at, server_ingested_at,
    clock_timestamp(), p_correlation_id, p_causation_id, p_actor_id, p_actor_type,
    p_actor_role, p_source_system, p_pii_context_id, p_payload, p_source_metadata
  )
  returning * into appended;

  return appended;
end;
$$;

create table imba.migration_batches_projection (
  migration_batch_id uuid primary key,
  organization_id uuid not null,
  source_system text not null,
  source_label text not null,
  status text not null,
  started_at timestamptz,
  completed_at timestamptz,
  last_ledger_position bigint not null,
  constraint migration_batches_id_v4 check (imba.is_uuid_v4(migration_batch_id)),
  constraint migration_batches_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint migration_batches_status check (
    status in ('PLANNED', 'EXTRACTING', 'VALIDATING', 'READY', 'RUNNING', 'COMPLETE', 'FAILED')
  )
);

create index migration_batches_org_status_idx
  on imba.migration_batches_projection (organization_id, status, last_ledger_position desc);

create table imba.source_records (
  source_record_id uuid primary key,
  organization_id uuid not null,
  migration_batch_id uuid not null,
  source_system text not null,
  source_entity text not null,
  source_identifier text not null,
  source_export_id text not null,
  source_occurred_at timestamptz,
  ingested_at timestamptz not null default clock_timestamp(),
  fingerprint text not null,
  redacted_snapshot jsonb not null,
  transform_version integer not null,
  mapping_version integer not null,
  disposition text not null,
  disposition_reason text,
  constraint source_records_id_v4 check (imba.is_uuid_v4(source_record_id)),
  constraint source_records_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint source_records_batch_fkey foreign key (migration_batch_id)
    references imba.migration_batches_projection (migration_batch_id),
  constraint source_records_disposition check (
    disposition in ('MATCHED', 'STAGED', 'TRANSFORMED', 'REJECTED', 'QUARANTINED')
  ),
  constraint source_records_fingerprint_key unique (
    organization_id, source_system, source_entity, fingerprint
  ),
  constraint source_records_snapshot_object check (jsonb_typeof(redacted_snapshot) = 'object')
);

create index source_records_batch_disposition_idx
  on imba.source_records (organization_id, migration_batch_id, disposition);

create trigger source_records_are_immutable
before update or delete on imba.source_records
for each row execute function imba.reject_event_mutation();

create table imba.field_mappings_projection (
  mapping_id uuid not null,
  organization_id uuid not null,
  source_system text not null,
  source_entity text not null,
  source_field text not null,
  canonical_field text not null,
  destination_system text not null,
  destination_entity text not null,
  destination_field text not null,
  transform_rule jsonb not null,
  validation_rules jsonb not null,
  prerequisite_mappings uuid[] not null default '{}',
  status text not null,
  confidence integer not null,
  proposed_by uuid not null,
  approved_by uuid,
  occurred_at timestamptz not null,
  ingested_at timestamptz not null,
  recorded_at timestamptz not null,
  version integer not null,
  last_ledger_position bigint not null,
  constraint field_mappings_pkey primary key (mapping_id, version),
  constraint field_mappings_id_v4 check (imba.is_uuid_v4(mapping_id)),
  constraint field_mappings_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint field_mappings_status check (
    status in ('PROPOSED', 'REQUIRES_DECISION', 'APPROVED', 'REJECTED', 'SUPERSEDED')
  ),
  constraint field_mappings_confidence check (confidence between 0 and 100),
  constraint field_mappings_version_positive check (version > 0),
  constraint field_mappings_transform_object check (jsonb_typeof(transform_rule) = 'object'),
  constraint field_mappings_validation_array check (jsonb_typeof(validation_rules) = 'array')
);

create index field_mappings_org_source_idx
  on imba.field_mappings_projection (
    organization_id, source_system, source_entity, source_field, version desc
  );

create table imba.migration_exceptions_projection (
  migration_exception_id uuid primary key,
  organization_id uuid not null,
  migration_batch_id uuid not null,
  source_entity text not null,
  source_identifier text not null,
  severity text not null,
  rule_code text not null,
  effect_summary text not null,
  evidence_reference text not null,
  status text not null,
  assigned_to uuid,
  opened_at timestamptz not null,
  resolved_at timestamptz,
  last_ledger_position bigint not null,
  constraint migration_exceptions_id_v4 check (imba.is_uuid_v4(migration_exception_id)),
  constraint migration_exceptions_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint migration_exceptions_batch_fkey foreign key (migration_batch_id)
    references imba.migration_batches_projection (migration_batch_id),
  constraint migration_exceptions_severity check (severity in ('INFO', 'WARNING', 'ERROR')),
  constraint migration_exceptions_status check (
    status in ('OPEN', 'ASSIGNED', 'RESOLVED', 'WAIVED')
  )
);

create index migration_exceptions_org_open_idx
  on imba.migration_exceptions_projection (organization_id, severity, opened_at)
  where status in ('OPEN', 'ASSIGNED');

create table imba.control_totals_projection (
  control_total_id uuid primary key,
  organization_id uuid not null,
  migration_batch_id uuid not null,
  source_system text not null,
  destination_system text not null,
  entity_type text not null,
  filter_criteria jsonb not null,
  record_count bigint not null,
  amount_minor bigint,
  currency char(3),
  calculation_version integer not null,
  source_coverage text not null,
  period_start timestamptz,
  period_end timestamptz,
  ingested_at timestamptz not null,
  result_status text not null,
  difference_count bigint not null,
  difference_amount_minor bigint,
  last_ledger_position bigint not null,
  constraint control_totals_id_v4 check (imba.is_uuid_v4(control_total_id)),
  constraint control_totals_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint control_totals_batch_fkey foreign key (migration_batch_id)
    references imba.migration_batches_projection (migration_batch_id),
  constraint control_totals_status check (result_status in ('PASS', 'FAIL', 'REQUIRES_REVIEW')),
  constraint control_totals_filters_object check (jsonb_typeof(filter_criteria) = 'object')
);

create index control_totals_org_batch_idx
  on imba.control_totals_projection (organization_id, migration_batch_id, entity_type);

create table imba.integration_connections_projection (
  integration_connection_id uuid primary key,
  organization_id uuid not null,
  provider text not null,
  connection_mode text not null,
  status text not null,
  capabilities jsonb not null,
  credential_reference text,
  last_ledger_position bigint not null,
  constraint integration_connections_id_v4 check (imba.is_uuid_v4(integration_connection_id)),
  constraint integration_connections_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint integration_connections_mode check (
    connection_mode in ('mock', 'live-readonly', 'live-write')
  ),
  constraint integration_connections_status check (
    status in ('MOCK', 'NOT_CONFIGURED', 'READY_FOR_READ', 'READ_ONLY', 'WRITE_DISABLED', 'CONNECTED', 'DEGRADED', 'ERROR')
  ),
  constraint integration_connections_capabilities_array check (jsonb_typeof(capabilities) = 'array')
);

create table imba.sync_runs_projection (
  sync_run_id uuid primary key,
  organization_id uuid not null,
  integration_connection_id uuid not null,
  resource_type text not null,
  status text not null,
  prior_cursor text,
  requested_through timestamptz not null,
  received_count bigint not null default 0,
  ingested_count bigint not null default 0,
  duplicate_count bigint not null default 0,
  failure_code text,
  failure_evidence_reference text,
  started_at timestamptz not null,
  completed_at timestamptz,
  last_ledger_position bigint not null,
  constraint sync_runs_id_v4 check (imba.is_uuid_v4(sync_run_id)),
  constraint sync_runs_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint sync_runs_connection_fkey foreign key (integration_connection_id)
    references imba.integration_connections_projection (integration_connection_id),
  constraint sync_runs_status check (status in ('STARTED', 'COMPLETED', 'FAILED'))
);

create index sync_runs_org_connection_idx
  on imba.sync_runs_projection (
    organization_id, integration_connection_id, resource_type, started_at desc
  );

create table imba.sync_cursors_projection (
  organization_id uuid not null,
  integration_connection_id uuid not null,
  resource_type text not null,
  cursor_value text not null,
  advanced_by_sync_run_id uuid not null,
  advanced_at timestamptz not null,
  last_ledger_position bigint not null,
  constraint sync_cursors_pkey primary key (
    organization_id, integration_connection_id, resource_type
  ),
  constraint sync_cursors_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint sync_cursors_connection_fkey foreign key (integration_connection_id)
    references imba.integration_connections_projection (integration_connection_id),
  constraint sync_cursors_run_fkey foreign key (advanced_by_sync_run_id)
    references imba.sync_runs_projection (sync_run_id)
);

create table imba.reconciliation_cases_projection (
  reconciliation_case_id uuid primary key,
  organization_id uuid not null,
  provider_batch_reference text,
  processor_settlement_reference text,
  bank_deposit_reference text,
  quickbooks_transaction_reference text,
  contribution_amount_minor bigint not null,
  processor_amount_minor bigint,
  bank_amount_minor bigint,
  quickbooks_amount_minor bigint,
  difference_amount_minor bigint not null,
  currency char(3) not null,
  status text not null,
  opened_at timestamptz not null,
  resolved_at timestamptz,
  last_ledger_position bigint not null,
  constraint reconciliation_cases_id_v4 check (imba.is_uuid_v4(reconciliation_case_id)),
  constraint reconciliation_cases_org_v4 check (imba.is_uuid_v4(organization_id)),
  constraint reconciliation_cases_status check (
    status in (
      'MATCHED', 'TIMING_DIFFERENCE', 'AMOUNT_DIFFERENCE', 'MISSING_IN_QUICKBOOKS',
      'MISSING_IN_EVERYACTION', 'MISSING_PROCESSOR_SETTLEMENT', 'MISSING_BANK_DEPOSIT',
      'DESIGNATION_MISMATCH', 'DUPLICATE', 'REFUND_OR_ADJUSTMENT',
      'REQUIRES_REVIEW', 'RESOLVED'
    )
  )
);

create index reconciliation_cases_org_open_idx
  on imba.reconciliation_cases_projection (organization_id, status, opened_at)
  where status <> 'RESOLVED';

-- RLS is defense in depth. The application must SET LOCAL imba.organization_id
-- from the authenticated server-side tenant context before querying these relations.
create function imba.current_organization_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('imba.organization_id', true), '')::uuid;
$$;

alter table imba.event_ledger enable row level security;
alter table imba.migration_batches_projection enable row level security;
alter table imba.source_records enable row level security;
alter table imba.field_mappings_projection enable row level security;
alter table imba.migration_exceptions_projection enable row level security;
alter table imba.control_totals_projection enable row level security;
alter table imba.integration_connections_projection enable row level security;
alter table imba.sync_runs_projection enable row level security;
alter table imba.sync_cursors_projection enable row level security;
alter table imba.reconciliation_cases_projection enable row level security;

create policy event_ledger_tenant_policy on imba.event_ledger
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy migration_batches_tenant_policy on imba.migration_batches_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy source_records_tenant_policy on imba.source_records
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy field_mappings_tenant_policy on imba.field_mappings_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy migration_exceptions_tenant_policy on imba.migration_exceptions_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy control_totals_tenant_policy on imba.control_totals_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy integration_connections_tenant_policy on imba.integration_connections_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy sync_runs_tenant_policy on imba.sync_runs_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy sync_cursors_tenant_policy on imba.sync_cursors_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());
create policy reconciliation_cases_tenant_policy on imba.reconciliation_cases_projection
  using (organization_id = imba.current_organization_id())
  with check (organization_id = imba.current_organization_id());

commit;
