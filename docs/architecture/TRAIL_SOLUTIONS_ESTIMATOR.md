# Trail Solutions Job Cost Estimator

Forward-looking companion to the historical analysis: predict a *new* job's cost from
IMBA's validated benchmark library. Reached via the **Estimator** tab in Trail Solutions.

## How it works (parametric, benchmark-driven — no ML)
`src/core/trail-solutions/estimator.ts` — `estimateJobCost(benchmarks, input)`, a pure
function. For the selected business line it applies each benchmark by its `unit`:
- `$ / <driver>` → cost line = rate (low/median/high) × driver quantity (per Mile →
  trail miles, per Each → installed units, per Project → project count).
- `% of ...` → applied to the direct-cost subtotal (PM %, contingency %).
- **Physical rates** (`Hours / Mile`, `Crew Days / Mile`, cycles) → surfaced as predicted
  *quantities*, never dollarized (that would require a labor rate the data lacks).
- `Forecast Variance %` (estimate accuracy) → an annotation, not a cost line.

Metric→cost-category is a keyword map onto the existing `CostCategory` / `COST_CATEGORIES`.
Missing components are reported as **not estimated** rather than guessed. Overall
confidence is the weakest applied benchmark, downgraded for small samples (n < 5).
Margin (when a bid is entered) reuses `safeMarginPercent` from `financials.ts`.

## UI
`src/components/imba/ImbaTrailSolutionsEstimator.tsx` (lazy-loaded in
`ImbaTrailSolutionsWorkspace.tsx`). Reads the **active workspace's** benchmarks
(`snapshot.benchmarks`) — demo data today, Joe's real numbers once uploaded. Shows a
predicted cost range, cost breakdown, forecast-margin range, predicted operational
quantities, confidence, and the estimate-accuracy note.

## Honesty guardrails
Benchmark-derived **range**, not a quote; sharpens as more completed projects are loaded.
Never fabricates: no benchmark → "not estimated"; physical rates stay as quantities.

## Persistence and handoff
Saving estimates and comparing predicted-vs-actual (`job_estimates` table + routes) —
added once the Neon layer is provisioned and merged.
## Current persistence status

Saved estimates are now organization-scoped planning artifacts in the
`job_estimates` table, with authenticated CEO/Finance access, audit events, and
optional linkage to a project code. They are not approved quotes, invoices, ERP
records, or general-ledger transactions. **Create project from estimate** only
prefills the controlled manual-project form; the user must review and explicitly
save the project through the same Trail Solutions workspace snapshot path used
by imports.

The estimate repository and routes require
`drizzle/0001_manual_entry_job_estimates.sql`. Without `DATABASE_URL`, the UI
returns a clear persistence-not-configured response and does not claim that the
estimate was saved.

The earlier deferred note in this document is superseded by the implemented
Neon persistence and routes described above.
