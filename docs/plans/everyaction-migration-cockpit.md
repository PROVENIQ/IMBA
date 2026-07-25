# EveryAction Migration Cockpit — ExecPlan

Status: Complete  
Started: 2026-07-24  
Owner: Codex implementation task

This document is the living execution record for the EveryAction migration
assurance cockpit and replacement-ready CRM foundation. Update it as findings,
decisions, implementation progress, and verification evidence change.

## Objective

Add a meeting-ready, synthetic migration-assurance module to the existing
IMBA-OS cockpit while extending—not replacing—the Phase 0 event-sourced
foundation. The immediate scope is migration assurance, provider boundaries,
reconciliation, and replacement-readiness evidence. It is not a complete CRM
replacement and does not authorize live provider writes.

## Repository audit

### Application and package structure

- One npm package managed by `package-lock.json`; no monorepo/workspaces.
- Next.js App Router application under `src/app`.
- Next.js `15.5.20`, React/React DOM `19.2.4`, TypeScript `5.7`, Tailwind CSS
  `3.4`, ESLint `8.57`, and Vitest `4.1`.
- One public route (`/`) renders a client-side cockpit. Sidebar navigation is
  state-driven using the `ImbaOsView` union rather than URL routes.
- The existing visual language uses Tailwind utilities, RGB CSS theme tokens,
  Lucide icons, responsive cards/tables, role-aware sidebar sections, and
  explicit prototype/source-boundary labels.

### Database and event foundation

- Raw PostgreSQL migration files under `db/migrations`; no ORM or database
  driver is installed.
- `0001_phase_zero_foundation.sql` defines the `imba` schema, immutable event
  ledger, optimistic append function, command results, quarantine, projections,
  outbox, provider decisions, PII contexts/erasure, and accounting packets.
- The ledger currently records `occurred_at` and server-defaulted
  `recorded_at`, but does not yet contain required organization, chapter scope,
  actor, source-system, or `ingested_at` columns.
- Event IDs/stream IDs are UUIDv4. Ledger position and infrastructure queue IDs
  use PostgreSQL identity columns; domain-facing identities are UUIDv4.
- TypeScript has an in-memory event store, schema/upcaster registry, command
  registry, branded identities, PII payload guard, provider evidence policy,
  projection checkpoint contract, and accounting packet validator.
- Existing event type examples use PascalCase. New migration/CRM events will use
  the repository canon’s `SCREAMING_SNAKE_CASE`; migration `0002` will enforce
  this for new canonical events without rewriting existing ledger history.

### Authentication, tenancy, and authorization

- There is no production authentication middleware, session provider, server
  authorization layer, or database RLS policy in this repository.
- The UI role selector demonstrates scoped navigation only and is explicitly
  not an enforcement boundary.
- Existing core contracts include `OrganizationId` and `ChapterId`, but the
  event envelope/store do not yet require tenant scope.
- This task can define and test least-privilege capability contracts and
  tenant-scoped services. It cannot truthfully claim deployed authentication or
  production enforcement until an auth model and database runtime are approved.

### Providers and accounting boundary

- No live QuickBooks, CiviCRM, EveryAction, payment-processor, or bank adapter
  exists.
- Existing connector UI/state is browser-local demonstration state.
- QuickBooks is already documented as authoritative for the GL. Existing
  accounting packets are proposed posting instructions, not a duplicate ledger.
- The new accounting port and mock adapter will be read-only and reconciliation
  focused.

### Fixtures, testing, CI, and deployment

- Existing demo data is hardcoded under `src/lib`; architecture fixtures live
  under `tests/fixtures`.
- Vitest currently runs four test files with 20 deterministic tests.
- Test coverage includes event schema evolution, stream concurrency, PII
  rejection, provider evidence, projection checkpoint monotonicity, money, and
  SQL contract assertions.
- There is no Playwright/Cypress dependency or CI workflow checked in.
- Deployment configuration is minimal Vercel auto-detection (`vercel.json`);
  analytics are present in the root layout.
- `.env.example` currently states that no credentials are required.
- Verification commands are `npm test`, `npm run typecheck`, `npm run lint`,
  and `npm run build`. No formatter script is configured.

### Existing domain/UI modules

- The cockpit already demonstrates Mission, Money, People, Development,
  Platform, Governance, Collaboration, System, Management, and a recently added
  Finance Integration section.
- Development views contain illustrative CRM/campaign concepts, but there is no
  canonical constituent or migration-assurance domain package.
- Finance Integration contains illustrative reconciliation/data-quality views;
  the new CRM Migration section will be a separate assurance workflow and will
  not replace those screens.

## Verified EveryAction API facts

Verified against official EveryAction documentation on 2026-07-24:

- Base REST API URL is `https://api.securevan.com/v4`.
- HTTP Basic Auth uses Application Name as username and API Key as password.
  API keys are context-specific and must not be exposed in client code.
- `GET /changedEntityExportJobs/resources` discovers resource types available to
  the authenticated API user.
- Changed Entity Export is asynchronous:
  `POST /changedEntityExportJobs`, then poll
  `GET /changedEntityExportJobs/{exportJobId}`.
- Changed Entity requests are limited to a prior 90-day change window and
  produce one or more expiring CSV download URLs.
- Officially documented Changed Entity coverage currently lists:
  ActivistCodes, ContactHistory, Contacts, ContactsActivistCodes,
  ContactsOnlineForms, ContactsSurveyResponses, ContributionAdjustments,
  Contributions, EventTicketTransactionsGuests, and RecurringContributions.
- Changed Entity returns the current version of records selected by a change
  window, not a historical snapshot as of `dateChangedTo`.
- `GET /changedEntityExportJobs/fields/{resourceType}` exposes available fields
  and related bulk-import mapping prerequisites.
- Bulk import is asynchronous (`POST /bulkImportJobs`, poll
  `GET /bulkImportJobs/{jobId}`) and availability varies by database mode,
  permissions, and product features.
- Financial Batches exist to help accounting teams reconcile contributions to
  bank statements; read endpoints include `GET /financialBatches`.
- Contribution/payment endpoints exist, but this task will not call payment
  endpoints or handle card data.
- Official pages disagree on changed-export link lifetime (overview says 20
  days; endpoint text says 24 hours). The implementation must treat links as
  short-lived and rely on each response’s `dateExpired`, never a hardcoded
  retention assumption.

Primary official references:

- https://docs.everyaction.com/reference/authentication
- https://docs.everyaction.com/reference/changed-entities-overview
- https://docs.everyaction.com/reference/changedentityexportjobs-resources
- https://docs.everyaction.com/reference/changedentityexportjobs
- https://docs.everyaction.com/reference/changedentityexportjobs-exportjobid
- https://docs.everyaction.com/reference/changedentityexportjobs-fields-resourcetype
- https://docs.everyaction.com/reference/bulk-import-overview
- https://docs.everyaction.com/reference/bulk-import-workflow
- https://docs.everyaction.com/reference/financial-batches-overview
- https://docs.everyaction.com/reference/financialbatches

## Architectural choices

1. Extend the modular TypeScript monolith under `src/core`; do not add a second
   application or service.
2. Keep provider-neutral ports in `src/core/providers`; provider DTOs and HTTP
   details stay under `src/integrations/everyaction`.
3. Extend branded UUID identities and generate new IDs with
   `crypto.randomUUID()`.
4. Require tenant, trace, actor, source, and three-time context in all new
   canonical events. The in-memory store stamps `ingestedAt` and `recordedAt`.
5. Add a forward-only `0002` PostgreSQL migration for migration-assurance
   storage and read-model tables; never modify `0001`.
6. Keep read models rebuildable from events. Demonstration interactions use a
   dedicated synthetic in-memory service that appends immutable events rather
   than mutating domain history.
7. Use deterministic generated synthetic data (stable seed and namespace UUIDs)
   so 500+ records do not need to be hand-maintained.
8. Implement a CSV-first CiviCRM adapter with explicit row disposition. A later
   APIv4 adapter can implement the same `MigrationSourcePort`.
9. Implement EveryAction `mock` and `live-readonly` behavior. Define but fail
   closed for `live-write`; do not implement payment/card operations.
10. Add least-privilege capability contracts now; document that real
    server-side enforcement awaits the approved authentication model.
11. Reuse the existing state-driven sidebar and workspace components for the
    meeting demonstration.

## Assumptions

- The current checked-out branch, including the Finance Integration prototype
  views, is the intended baseline and must be preserved.
- Synthetic records may use human-readable fictional names in browser-only
  fixtures because they are deterministic and explicitly labeled synthetic.
- EveryAction API capabilities differ by credential, database mode, and product
  configuration; hardcoded capability claims are fallback documentation only.
- CiviCRM source exports will be supplied as UTF-8 CSV with headers. Exact IMBA
  column names remain unknown, so mapping is versioned and configurable.
- No production database will be applied or live credential tested in this task.

## Unresolved IMBA-specific questions

- Approved authentication provider, session model, and server authorization
  enforcement mechanism.
- National/chapter tenant topology and whether cross-chapter household/person
  visibility is allowed.
- Actual CiviCRM export schemas, encodings, identifiers, and data volumes.
- Actual EveryAction database mode, enabled resources, custom fields, activist
  codes, source codes, supporter groups, membership configuration, and
  financial-batch usage.
- Identity matching/merge policy and reversal authority.
- Retention, legal hold, suppression, consent, and data-export policies.
- QuickBooks entity IDs/classes/custom fields and approved reconciliation
  ownership.
- Payment processor(s), settlement identifiers, bank-feed source, and timing
  expectations.
- Definition of migration readiness and acceptable control-total tolerances.

## Implementation milestones

- [x] Read all applicable repository instructions (none existed before this
  task).
- [x] Audit repository architecture, tests, UI, database, auth, and deployment.
- [x] Verify relevant EveryAction endpoints and limitations from official docs.
- [x] Add repository-wide IMBA-OS canon.
- [x] Create this living ExecPlan.
- [x] Extend canonical identities, event envelope/store, and schema registry.
- [x] Add CRM, membership, fundraising bridge, migration, integration, and
  reconciliation domain contracts.
- [x] Add provider-neutral ports and access capability contracts.
- [x] Implement EveryAction DTO validation, mapping, mock adapter, read-only HTTP
  scaffold, write gate, and changed-entity workflow.
- [x] Implement CSV-first CiviCRM source adapter.
- [x] Implement versioned crosswalk, validation/control totals, reconciliation,
  and replacement-readiness registry.
- [x] Add deterministic 500+ record synthetic dataset.
- [x] Add PostgreSQL migration and SQL contract tests.
- [x] Add CRM Migration navigation and five primary screens plus Replacement
  Readiness.
- [x] Add required integration/domain/security documentation.
- [x] Run all automated checks and browser-verify the required walkthrough.
- [x] Record final results, limitations, and recommended next slice.

## Progress log

### 2026-07-24 — Audit and plan

- Confirmed repository is a client-only Next.js cockpit plus an undeployed,
  tested Phase 0 production foundation.
- Confirmed no existing `AGENTS.md`, ORM, database driver, production auth, CI,
  or live provider adapter.
- Confirmed existing event ledger and branded primitives should be extended
  rather than replaced.
- Verified EveryAction authentication, Changed Entity, bulk-import, financial
  batch, and resource-discovery boundaries from official documentation.
- Added the root canon and initialized this ExecPlan.

### 2026-07-24 — Domain and persistence foundation

- Added provider-neutral CRM, membership, fundraising, migration, integration,
  reconciliation, access-capability, and source-port contracts.
- Hardened the TypeScript event envelope and in-memory store with required
  organization/chapter scope, trace IDs, actor/source context, immutable payloads,
  tenant-scoped reads, and server-stamped ingestion/recording times.
- Added a projection replay utility and tests proving deterministic tenant-scoped
  rebuilds.
- Added forward migration `0002_crm_migration_foundation.sql`. It upgrades the
  event ledger contract, provides tenant RLS, and creates migration/sync/control/
  reconciliation projections plus immutable source rows. It deliberately refuses
  to apply to a populated ledger without a separately reviewed tenancy backfill.

### 2026-07-24 — Sources, adapters, and assurance engines

- Added a CSV-first CiviCRM adapter with quoted CSV support, safe source evidence,
  fingerprints, exact control totals, and explicit staged row disposition.
- Added EveryAction mock and HTTP transports, server-side Basic Auth, DTO guards,
  documented capability strategies, bounded export-job polling, cursor-safe
  changed-entity ingestion, idempotency, and a fail-closed bulk-write gate.
- Added versioned crosswalks, reusable validation, exact control-total comparison,
  identity and financial reconciliation, and immutable tenant-checked resolution
  history.

### 2026-07-24 — Demonstration and documentation

- Added a deterministic 640-person national/chapter dataset plus households/
  organizations, external identities, suppressions, mappings, exceptions,
  adjustments, recurring coverage, failed migration evidence, and financial
  differences.
- Added role-aware `CRM Migration` navigation with Migration Health, Field
  Crosswalk, Exception Queue, Financial Reconciliation, and Integration Readiness.
  Replacement Readiness is a first-class panel inside Integration Readiness so the
  primary navigation remains the requested five-screen set.
- Added all requested integration, domain, and security documentation and safe
  environment examples.

## Verification results

- `npm run lint`: passed with zero errors or warnings after cleanup.
- `npm run typecheck`: passed.
- `npm test`: 9 files, 36 tests passed.
- `npm run build`: passed; Next.js statically prerendered `/`.
- Browser verification at 1440×1000: page rendered, exact synthetic banner was
  visible, no Next.js error overlay or browser errors were present, all five
  screens were reachable, the membership decision appeared, the missing-
  designation case appended a visible resolution event, financial difference
  drilldown rendered, writes showed disabled, and all 24 replacement capabilities
  defaulted EveryAction use to `UNKNOWN` with cutover ineligible.
- Screenshots:
  `crm-migration-health-viewport.png` and
  `crm-financial-reconciliation.png` under the task visualization directory.

## Completion notes

### Production behavior still disabled

- EveryAction and QuickBooks production writes.
- Live EveryAction reads without an explicitly configured server credential.
- Payment-card handling (intentionally unsupported).
- Live CiviCRM, processor, bank, or QuickBooks connections.
- Production constituent access because this repository has no deployed
  authentication/session implementation.

### Known limitations and risks

- The SQL migration has contract tests but was not applied to a live PostgreSQL
  instance because the repository has no database runtime or connection.
- `0002` requires an empty ledger or a separately approved tenant backfill.
- The read-only HTTP adapter scaffolds official job/status/resource paths; an
  authorized EveryAction context is still needed to confirm IMBA-specific
  capabilities, fields, pagination shapes, volumes, and rate behavior.
- The current UI role selector is presentation logic, not a security boundary.
- Browser demonstration decisions reset on reload; durable command handlers need
  an approved database/auth runtime.

### Recommended next slice

Implement the authenticated server boundary: select the identity provider, map
users to organization/chapter capability grants, add a PostgreSQL runtime with
transaction-scoped tenant context, apply `0002` in a disposable environment, and
run an authorized EveryAction `live-readonly` discovery spike. Then ingest a
sanitized CiviCRM schema sample to replace assumed field names with an approved
crosswalk—while keeping every provider write disabled.
