# Trail Solutions Financial Management

Status: Demonstration read model implemented; production sources and writes are
not enabled.

Trail Solutions Financial Management turns detailed project-cost data into
clear, timely information about performance, risk, and the decisions requiring
attention.

## System boundary

The historical job-costing workbook supplies the discovery schema and control
logic. It is not a browser database or a permanent system of record. The demo
adapter transforms a controlled, synthetic JSON snapshot into typed source
records and a normalized `ProjectFinancialSummary` read model.

The revised mart shape is represented explicitly: labor and nonlabor actuals
carry award/funding treatment and ADP charge-versus-work project controls;
Grant Funding is an agreement read model; Match Activity Detail and Forecast
Updates are first-class child records; Unmapped Exceptions remain quarantined;
and Shared Cost Allocation Rules are reference-only policy metadata. No shared
cost rule silently reallocates a transaction.

IMBA-OS owns the management presentation, source crosswalks, validation
exceptions, decision-support policy, immutable import/forecast events, and
rebuildable projections. QuickBooks remains authoritative for the general
ledger. A selected ERP will be authoritative for production project accounting;
ADP and Monday.com may supply labor and operational facts through future
organization-scoped adapters.

```text
Workbook discovery model
        |
controlled synthetic transform
        |
validated source records + quarantined exceptions
        |
ProjectFinancialSummary projection
        |
portfolio -> project evidence -> intentional finance drill-down

Future: ERP / ADP / Monday.com adapters implement the same data-source contract.
```

No live provider connection is implemented. QuickBooks, ERP, ADP, Monday.com,
EveryAction, and all other production writes remain disabled.

## Data Import Lab prototype

Finance receives a self-service testing checkpoint inside the Trail Solutions
workspace. It accepts the standardized `.xlsx` workbook or separately exported
CSV tables and guides the user through workspace selection, upload, mapping,
validation, reconciliation preview, isolated import, and review.

The Node.js import boundary applies file/row limits and rejects obvious banking,
donor, government-identifier, personal-contact, and employee-identity fields.
Source previews redact people, vendor, reviewer, and note values. The normalized
test output contains project summaries, aggregate cost/labor summaries, and
exceptions; named employee/source records are not retained in browser state.

Test workspaces are separate, versioned browser-local datasets. Selecting one
replaces the active Trail Solutions read model for that browser session; it does
not merge with the synthetic demonstration and cannot target production. Create,
add, replace, duplicate, rename, archive, and delete are available. Add rejects
colliding Project IDs, while replace preserves earlier import-version metadata.

This is intentionally not a production upload service or accounting system of
record. The prototype role header is not production authentication, source files
are not durably retained, and the local version list is not a durable audit
ledger. Production enablement requires server-enforced claims, organization-
scoped durable workspaces, immutable import/export events, malware scanning,
encrypted object storage, retention/deletion controls, and idempotent background
jobs.

## Financial definitions

The adapter computes financial truth once, before rendering:

- current contract = original contract + approved change orders;
- forecast final cost = actual cost to date + explicit estimate to complete;
- forecast margin = current contract - forecast final cost;
- forecast margin percentage is omitted when its denominator or forecast is
  unavailable;
- invoices, recognized revenue, cash receipts, receivables, and unbilled earned
  value remain separate;
- labor hours and labor dollars remain separate;
- award cost, cash match, unrestricted/non-award, and ineligible treatment are
  distinct; eligible cost, match accumulated, outstanding reimbursement, and
  award cash exposure are calculated from classified records;
- forecast updates are immutable snapshots with date, owner, ETC source,
  confidence, and required action; prior snapshots are never overwritten;
- unresolved material mapping or forecast gaps force `data-incomplete` and null
  forecast outputs rather than false precision.

The controlled workbook snapshot contains integral USD display units because it
mirrors the supplied template. Canonical financial events serialize amounts as
the repository `Money` type: integer minor units plus currency. A production
adapter must perform currency-aware normalization before proposing an event.

## Source controls

The workbook field map is explicit and versioned in code. The adapter validates
organization identity, UUIDv4 project identities, required text, non-negative
numeric inputs, duplicate project identities, source-record fingerprints, cost
category reconciliation, and staffing-hour reconciliation. Unknown records are
represented as exceptions and are never silently assigned to a project.

Source identifiers remain opaque crosswalk values; they never replace the
canonical `ProjectId`. Business dates are retained on source facts. Canonical
events distinguish `occurredAt`, server-stamped `ingestedAt`, and server-stamped
`recordedAt`, and always contain tenant, actor, correlation, and causation
context.

## Presentation and access

The existing state-driven cockpit navigation is preserved. The Trail Solutions
workspace provides portfolio, project, benchmark, exception, and data-health
views without adding a second routing architecture.

Trail Solutions owns Financial management, Project job costing, Project
delivery, and Construction reports in the cockpit navigation. Mission retains
organization-wide mission, program, policy, asset, and impact views. Existing
view identifiers and screen components are preserved so the ownership cleanup
does not break working demonstrations or role access.

- The CEO role receives the complete IMBA-OS navigation and all demonstrated
  operating functions. Its executive brief is a default home, not an access
  boundary.
- Executive and Trail Solutions roles receive the portfolio, project evidence,
  benchmark, and decision views.
- Finance additionally receives source-level transaction drill-down and data
  health/control totals, plus a direct **Upload data for analysis** navigation
  entry into the controlled Data Import Lab.
- Planning receives management summaries and supporting project evidence.
- Employee compensation and named payroll detail are not exposed.
- CEO access includes the complete IMBA-OS navigation and the Finance upload /
  validation workspace; the executive brief is a default landing view only.

Decision status changes in the demonstration are browser-local presentation
state. They do not claim durable workflow completion or append production
events.

## Controlled manual management path

The portfolio and project detail surfaces provide two explicit entry paths:
bulk source-data import through the Data Import Lab, and controlled manual
management entry through **New Project** / project-level **Add** actions. Manual
projects, forecast snapshots, change orders, operational drivers, funding and
agreement records, match activities, and decision/action items are folded into
the same `ValidatedImportPackage` and workspace version path as imported data.
Each write carries manual provenance and a precise audit action. Approved
change orders are the only change-order status that changes contract and budget
projections; pending or draft requests remain visible without changing current
contract value. This path is intentionally limited to management, forecasting,
estimating, award/match controls, and decisions—not general-ledger or source
transaction editing.

## Replaceable adapter contract

`TrailSolutionsDataSource` is the UI boundary. A future adapter must preserve
organization isolation and implement portfolio, project, benchmark, exception,
decision, and data-health reads. It must produce the same normalized read model,
regardless of whether the source is an ERP API, ADP export, Monday.com extract,
or controlled transition file.

Production ingestion additionally requires approved authentication, durable
storage, append-only import events, resumable/idempotent jobs, control-total
reconciliation, telemetry redaction, and server-enforced roles. Those
capabilities are intentionally not represented as active in this demo.

## Configurable assumptions

The demonstration health policy is versioned and labeled as an assumption.
Finance must approve thresholds for margin, cost overrun, labor-hour variance,
billing lag, stale forecasts, and material data exceptions before production
use. Internal benchmark ranges likewise require approved cohorts, minimum
sample sizes, and validation ownership.
