# IMBA-OS Canon

These instructions apply to the entire repository.

IMBA-OS is an event-sourced association operating system. It is being extended
to support migration assurance across CiviCRM, EveryAction, and QuickBooks,
with an architecture capable of eventually replacing selected CRM functions.

## Mission

Protect the “99% Built” mission.

Build production-quality foundations, not disconnected mock screens. However,
all EveryAction and QuickBooks production writes must remain disabled until
explicitly authorized.

## Repository-first rule

Before changing code:

1. Inspect the repository structure, existing `AGENTS.md` files, package
   manager, database layer, authentication, routing, UI patterns, test
   framework, and deployment configuration.
2. Reuse existing architecture and components.
3. Do not replace working infrastructure merely because another implementation
   would be easier.
4. Record assumptions and unresolved questions.
5. For multi-hour work, create and maintain an ExecPlan under `docs/plans/`.

## Time canon

Never use `createdAt` or `updatedAt` for business logic.

Every domain event must distinguish:

- `occurredAt`: when the business event actually occurred
- `ingestedAt`: when the server received or imported it
- `recordedAt`: when it was durably appended to the event ledger

The server stamps `ingestedAt` and `recordedAt`.

Provider timestamps such as EveryAction modified dates may be stored as source
metadata but must not become canonical business ordering.

Never trust client clocks for canonical ordering.

## Identity canon

Never use integer auto-increment identifiers.

Use UUIDv4 generated with `crypto.randomUUID()`.

Use branded domain identifiers rather than primitive strings, including:

- `OrganizationId`
- `ChapterId`
- `PersonId`
- `HouseholdId`
- `RelationshipId`
- `ContributionId`
- `RecurringCommitmentId`
- `FinancialBatchId`
- `MigrationBatchId`
- `MigrationExceptionId`
- `ReconciliationCaseId`
- `IntegrationConnectionId`
- `SyncRunId`
- `EventId`
- `CorrelationId`
- `CausationId`

External provider identifiers are opaque strings stored separately from
internal IMBA-OS IDs.

## Event canon

Use `SCREAMING_SNAKE_CASE` event names.

Core domain state is immutable. Never overwrite historical domain truth with
`UPDATE` statements.

Changes are represented by new events such as:

- `PERSON_REGISTERED`
- `PERSON_NAME_CORRECTED`
- `CONTACT_POINT_ADDED`
- `CONTACT_POINT_SUPPRESSED`
- `EXTERNAL_ID_LINKED`
- `RELATIONSHIP_RECORDED`
- `MEMBERSHIP_STARTED`
- `MEMBERSHIP_RENEWED`
- `MEMBERSHIP_ADJUSTED`
- `CONTRIBUTION_RECORDED`
- `CONTRIBUTION_ADJUSTED`
- `CONTRIBUTION_VOIDED`
- `RECURRING_COMMITMENT_RECORDED`
- `FINANCIAL_BATCH_IMPORTED`
- `MIGRATION_BATCH_STAGED`
- `FIELD_MAPPING_PROPOSED`
- `FIELD_MAPPING_APPROVED`
- `SOURCE_RECORD_INGESTED`
- `SOURCE_RECORD_MATCHED`
- `SOURCE_RECORD_REJECTED`
- `VALIDATION_EXCEPTION_OPENED`
- `VALIDATION_EXCEPTION_RESOLVED`
- `CONTROL_TOTAL_CALCULATED`
- `CONTROL_TOTAL_RECONCILED`
- `CONTROL_TOTAL_DIFFERENCE_DETECTED`
- `SYNC_RUN_STARTED`
- `SYNC_CURSOR_ADVANCED`
- `PROVIDER_RECORD_LINKED`
- `SYNC_RUN_COMPLETED`
- `SYNC_RUN_FAILED`
- `RECONCILIATION_CASE_OPENED`
- `RECONCILIATION_CASE_RESOLVED`

Projection tables may be updated because they are disposable read models, but
they must be rebuildable entirely from the immutable event ledger.

## Tenancy and trace canon

Every event must contain:

- `organizationId`
- `chapterId` or an explicit `NATIONAL` scope
- `correlationId`
- `causationId`
- actor identity
- source system
- `occurredAt`
- `ingestedAt`
- `recordedAt`

Never omit tenant or trace context.

## Integration boundaries

- QuickBooks remains authoritative for the general ledger.
- IMBA-OS must not infer that EveryAction automatically posts donations to
  QuickBooks.
- EveryAction is initially an external operational source.
- CiviCRM is a historical migration source.
- IMBA-OS owns its canonical event ledger, migration decisions, validation
  results, crosswalks, reconciliation cases, and eventual constituent model.
- Provider adapters must map provider concepts into canonical IMBA-OS concepts.
- Do not duplicate EveryAction’s confusing vocabulary when a simpler canonical
  concept is possible.

## External writes

Production writes are disabled by default.

Every provider adapter must support explicit modes:

- `mock`
- `live-readonly`
- `live-write`

`live-write` must require:

1. A server-side feature flag
2. A permitted credential
3. Explicit human approval
4. An immutable audit event
5. Idempotency protection
6. A preview of the proposed operation

Never expose credentials or Basic Authentication headers to browser code.

## Security and privacy

- Keep provider credentials server-side.
- Never log API keys, authorization headers, payment credentials, or full
  sensitive constituent records.
- Redact personally identifiable information in error telemetry.
- Enforce least-privilege access.
- Add audit events for exports, merges, suppressions, and financial
  adjustments.
- Production data must never appear in fixtures, screenshots, or committed
  files.

## Demonstration-data rule

Until IMBA supplies authorized data, all CRM screens must use synthetic
records.

Every demonstration screen must visibly state:

> Synthetic demonstration data — not connected to IMBA systems.

Do not imply that sample problems are known IMBA problems.

## Testing

Every implementation must include:

- unit tests
- integration tests
- event-schema tests
- idempotency tests
- tenant-isolation tests
- provider-adapter contract tests
- projection rebuild tests
- end-to-end tests for the primary demonstration path

Run the repository’s formatter, type checker, test suite, and production build
before completing work. If no formatter is configured, record that fact instead
of introducing an unrelated formatting stack.

## Completion report

At the end of each task, report:

- files changed
- migrations added
- tests added and results
- assumptions
- production capabilities still disabled
- unresolved risks
- recommended next task
