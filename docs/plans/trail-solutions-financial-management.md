# Trail Solutions Financial Management — ExecPlan

Status: Phase 2 in progress — Manual management workflow
Started: 2026-08-06  
Owner: Codex implementation task

This is the living execution record for the Trail Solutions Financial
Management module. It will be updated as implementation and verification
evidence change.

## Objective

Turn the historical job-costing workbook's financial structure into a simple,
decision-oriented Trail Solutions management experience. The workbook remains
a discovery and migration-design source. A future ERP remains the financial
system of record; IMBA-OS is the management and decision-support layer.

## Data Import Lab extension

### Revised mart alignment

- [x] Extend labor/nonlabor/grant models with award treatment, ADP
  charged-versus-work project IDs, agreement ownership/status, reimbursement,
  match, and cash-exposure fields.
- [x] Add Match Activity Detail, Forecast Updates, Unmapped Exceptions, and
  Shared Cost Allocation Rules import contracts.
- [x] Add grant agreement controls, cross-project labor review, stale forecast
  detection, and immutable forecast-history presentation.
- [x] Surface funding and agreement KPIs at portfolio and project level while
  preserving benchmark/estimator behavior and the no-ERP-shadow boundary.
- [x] Give the CEO complete IMBA-OS navigation and direct access to the data
  upload/analysis workspace.

The follow-up increment adds a Finance-only, self-service testing loop:

`upload -> inspect/map -> validate -> preview/reconcile -> import into an isolated test workspace -> review`.

The initial implementation parses `.xlsx` and `.csv` files in a Node.js route
handler, enforces file-size/type and prohibited-field checks, and returns a
sanitized aggregate suitable for the management UI. The browser does not parse
large workbooks repeatedly and does not receive employee names, individual
compensation, bank data, donor PII, or other prohibited source fields.

Because this repository has no approved production authentication or database
runtime, named workspaces and version history are versioned browser-local
prototype state. Server timestamps returned by validation are used for import
display. The UI must not describe this as a durable production audit trail.
Production persistence, server-enforced authorization, malware scanning, object
storage, retention, and legal deletion controls remain entry conditions for a
live deployment.

## Manual management workflow (Phase 2)

The current increment adds the missing project-management path between bulk
imports. It must keep using the existing `ValidatedImportPackage` / workspace
version write path; it must not become a general ledger or transaction-entry
system.

- [x] Add a durable manual project create form and estimator handoff.
- [x] Add durable forecast and match activity records with provenance.
- [x] Add project-level change orders, operational-driver updates, funding /
  agreement updates, and decision/action records.
- [x] Add the complete project-level Add menu and persist every action with a
  precise audit event.
- [ ] Verify the estimator → project → forecast → match → refresh /
  re-authentication / second-user acceptance path end to end. This remains
  blocked until the production Vercel environment has a `DATABASE_URL`.
- [x] Run local verification and deploy the completed code increment to
  production. Durable production saves remain disabled until the database is
  provisioned and migrated.

### Data Import Lab milestones

- [x] Add import/workspace types, expected-table specifications, mapping rules,
  validation severity, control totals, and environment labels.
- [x] Add a Finance-gated server parser for `.xlsx` and `.csv`, upload limits,
  prohibited-field rejection, mapping application, validation, reconciliation,
  and safe management-model transformation.
- [x] Add multiple isolated test workspaces, version history, open/rename/
  duplicate/archive/delete/reset controls, and explicit confirmation for
  destructive presentation-state actions.
- [x] Add the seven-step guided Data Import Lab and downloadable exception,
  summary, variance, benchmark, reconciliation, and normalized-data outputs.
- [x] Allow an imported test workspace to drive portfolio and project analysis
  without mixing it with demonstration data.
- [x] Add parser, mapping, reconciliation, security, isolation, calculation, and
  UI contract tests.
- [x] Add funding-control tests for award eligibility, match valuation,
  reimbursement/exposure calculations, cross-project labor, and forecast
  snapshots.
- [x] Re-run lint, typecheck, tests, production build, desktop/mobile browser
  verification, and the finance-control audit.

## Repository audit

- One npm package managed by `package-lock.json`; no monorepo.
- Next.js 15 App Router, React 19, TypeScript, Tailwind, Lucide, Vitest.
- The public application is a single client-side cockpit route with state-driven
  navigation and role-aware presentation. There is no production authentication
  or database runtime.
- Existing visual conventions use responsive cards/tables, theme RGB tokens,
  explicit source boundaries, keyboard-accessible controls, and synthetic-data
  labels.
- Existing Trail Solutions views cover mission lifecycle, job costing, delivery,
  and construction reporting, but the default surfaces expose too much
  finance-side detail and lack a normalized management summary.
- Existing core architecture provides branded UUIDv4 identities, canonical
  event envelopes with tenant/trace/three-time context, immutable in-memory
  storage, and rebuildable projection utilities.
- Raw PostgreSQL migrations exist, but there is no ORM, database driver, or
  approved production auth/session layer.
- Tests run through Vitest. There is no browser E2E dependency or formatter
  script. Required verification commands are `npm run lint`,
  `npm run typecheck`, `npm test`, and `npm run build`.

## Workbook audit

The supplied workbook has 17 tabs. Its authoritative domains are Project
Master, Project Crosswalk, Estimate Lines, Labor Actuals, Nonlabor Actuals,
Revenue & Billing, Change Orders, Operational Drivers, Grant Funding, Labor Rate
Library, Cost Code Map, Unmapped Exceptions, Project Summary, Benchmark Library,
and Setup & Lists.

Key controls to preserve:

- One canonical Project ID with source-system identifiers kept separately.
- Estimate, labor, nonlabor, billing, grants, change orders, and operational
  drivers remain distinct source records.
- Business and accounting dates are separate when both exist.
- Contract value, invoices, recognized revenue, and cash receipts are not
  interchangeable.
- Unknown mappings are quarantined; they are never silently assigned.
- Labor hours and labor dollars are both retained.
- Project Summary is a formula-driven read model. Estimate to complete is the
  explicit forecast input; forecast final cost is actual cost plus ETC.
- Benchmarks are ranges with sample size and confidence, never unsupported
  “industry standards.”

## Architectural choices

1. Add a top-level Trail Solutions navigation section using the existing
   state-driven routing convention rather than introducing a second app shell.
2. Use a typed `TrailSolutionsDataSource` contract. The first adapter reads a
   controlled, synthetic workbook-derived JSON snapshot; future ERP/ADP/
   Monday.com adapters can implement the same contract.
3. Normalize source records into `ProjectFinancialSummary` before rendering.
   UI components must not independently recompute financial truth.
4. Put health thresholds in a versioned policy object and force
   `data-incomplete` when critical mapping/forecast inputs are unresolved.
5. Keep detailed transactions behind intentional drill-down and Finance-only
   data-health presentation.
6. Use five hypothetical active projects to demonstrate on-track, labor
   variance, change-order, billing-lag, and incomplete-data cases.
7. Store only role-level labor mix in leadership data. Employee compensation
   detail is not exposed.
8. No external integrations or provider writes are added. QuickBooks remains
   authoritative for the GL; the future ERP remains authoritative for project
   accounting.
9. Demonstration decision actions remain browser-local presentation behavior;
   no durable command is claimed without an approved auth/database runtime.

## Assumptions

- The supplied template, rather than the differently named mapped workbook in
  the brief, is the available discovery source.
- Exact IMBA historical source fields and thresholds are not yet approved.
- Configurable demo thresholds may be used if visibly labeled as assumptions.
- The single-route cockpit's internal workspace tabs satisfy the repository's
  routing convention; separate URL routes are deferred until the app adopts URL
  routing generally.
- No production data will be used or committed.

## Unresolved questions

- Approved source extracts and field mappings from QBO, ADP, Monday.com, and the
  selected ERP.
- Approved margin, billing-lag, forecast-staleness, and exception materiality
  policies by business line.
- Forecast update ownership and cadence.
- Production identity provider, server-side roles/capabilities, and row-level
  authorization.
- Whether earned-value or revenue-recognition inputs will be available for a
  defensible unbilled-earned calculation.
- Approved benchmark cohorts and minimum sample sizes.
- Approved production identity provider and server-side Finance/admin claims for
  file upload and workspace lifecycle operations.
- Approved object storage, malware scanning, retention, backup, and deletion
  policies for source workbooks and derived workspace versions.
- Maximum production workbook size and row limits by source table.

## Implementation milestones

- [x] Audit repository, workbook, architecture, UI, auth, tests, and deployment.
- [x] Create this ExecPlan.
- [x] Add Trail Solutions identities, domain models, policies, calculations,
  event schemas, adapter contract, and projection.
- [x] Add controlled workbook-derived synthetic JSON and adapter validation.
- [x] Add portfolio, project detail, benchmarks, exceptions, and Finance
  data-health views.
- [x] Add role-aware navigation and preserve existing pages.
- [x] Add unit, integration, schema, idempotency, tenant, adapter-contract,
  projection-rebuild, and primary-path tests.
- [x] Verify lint, typecheck, tests, build, and responsive browser behavior.
- [x] Conduct the Joe-perspective simplification review.
- [x] Record final results, limitations, disabled production capabilities, and
  recommended next task.

## Progress log

### 2026-08-06 — Audit and plan

- Confirmed the app already has Trail Solutions lifecycle, job-costing, and
  delivery concepts but no decision-first financial management module.
- Confirmed the workbook's normalized source domains, formula definitions,
  mapping quarantine, benchmark confidence, and data-readiness controls.
- Selected a replaceable adapter and normalized summary architecture aligned to
  the existing modular TypeScript monolith.

### 2026-08-06 — Implementation and Joe review

- Added the Trail Solutions data-source contract, workbook-derived synthetic
  adapter, explicit field map, normalized financial summary, configurable
  health policy, canonical event schemas, and rebuildable forecast projection.
- Added a primary Trail Solutions cockpit section with portfolio, project
  evidence, benchmark, exception, and Finance-only data-health views.
- Kept source-level transactions behind Finance-only intentional drill-down and
  retained hours alongside labor dollars.
- Moved management decisions directly beneath the four essential portfolio
  signals so secondary finance metrics do not push the action queue below the
  first management sequence.
- Collapsed the full module introduction on project/secondary views so the
  selected project and its financial evidence appear sooner.
- Added an application icon after browser verification found the prior missing
  favicon request.

### 2026-08-06 — Data Import Lab extension

- Added server-side `.xlsx`/CSV parsing with workbook header detection, mapping
  proposals, file and row limits, privacy-minimized samples, and prohibited
  sensitive-field/employee-identity rejection.
- Added validation and quarantine controls for duplicate and unknown Project
  IDs, missing required fields, cost-code mappings, labor dollars without hours,
  operational dollars without quantities, billing differences, and absent ETC.
- Added reconciled source/load control totals and a sanitized normalized output;
  forecast and productivity analyses remain explicitly unavailable when their
  required inputs are not reliable.
- Added seven guided Finance steps, reusable mapping templates, multiple
  isolated named workspaces, replace/add version history, lifecycle controls,
  download reports, and an environment switch that never mixes test and
  demonstration records.
- Browser-tested the supplied workbook: 13 relevant tables were detected at
  physical header row 4; preformatted/formula-only capacity rows were ignored;
  the workbook was blocked at validation because its sample Project Manager and
  Employee / Resource values violate the no-employee-identity upload policy.

### 2026-08-06 - Navigation ownership cleanup

- Moved Project job costing, Project delivery, and Construction reports from
  Mission to Trail Solutions while preserving each role's existing access.
- Removed the unreachable legacy Trail Solutions configuration from the Mission
  workspace and its report-source lists.
- Added a navigation ownership regression test so Trail Solutions project views
  cannot be duplicated under Mission.

## Verification results

- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm test`: 17 files and 79 tests passed.
- `npm run build`: passed; the root route, import API, and application icon prerendered.
- Desktop browser flow: portfolio loaded, decision evidence opened project
  detail, supported variance explanations rendered, and no error overlay was
  present.
- Finance browser flow: Data health rendered validation checks, control totals,
  source status, and explicit disabled-write labels.
- Mobile browser flow at 390 x 844: responsive cards rendered and the document
  had no horizontal overflow.
- Fresh browser session: zero console errors or warnings.
- Navigation ownership flow: CEO and Finance menus placed their permitted job
  costing, delivery, and construction views under Trail Solutions; Mission no
  longer duplicated them. The moved screens opened successfully on desktop and
  the 390 x 844 menu had no horizontal overflow.
- Data Import Lab desktop flow: Finance selected an isolated workspace, uploaded
  the supplied `.xlsx`, inspected all mapped tables, and received structured
  blocking privacy issues rather than a failed or partial import.
- Data Import Lab mobile flow at 390 x 844: validation results and the blocking
  readiness state remained visible; no Next.js error overlay was present.
- Dependency audit: the newly introduced ExcelJS UUID advisory and the existing
  Sharp advisory were mitigated with tested transitive overrides. `npm audit`
  still reports one inherited high PostCSS advisory (and its moderate Next.js
  effect); npm's supported remediation is a breaking Next.js 16.3 upgrade, which
  is intentionally left for a dedicated framework-upgrade task.
- No formatter script is configured; no unrelated formatting stack was added.

The final local-browser refresh reached the Clerk sign-in gate after the demo
server restart, so the CEO upload navigation could not be clicked in that
session without user authentication. The server is running at
`http://localhost:3910/` for the user to sign in and continue testing.

## Completion notes

- No database migration was added. The repository has no approved production
  auth/database runtime for this module; the implementation uses the existing
  immutable event foundation and a controlled read adapter rather than claiming
  durable production ingestion.
- All records in the module are synthetic and visibly labeled. No IMBA source
  data or personally identifiable information is included.
- QuickBooks, EveryAction, ERP, ADP, Monday.com, and all production writes remain
  disabled. Demonstration decision statuses are browser-local only.
- Remaining production decisions are approved source extracts and field maps,
  health thresholds, benchmark cohorts, forecast ownership/cadence, revenue
  recognition inputs, production identity/roles, and the selected ERP.
- Recommended next task: approve a representative redacted source extract and
  mapping/control-total packet, then implement a server-side read-only import
  job against the same `TrailSolutionsDataSource` contract.
