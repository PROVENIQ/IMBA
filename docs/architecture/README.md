# IMBA-OS Production Architecture

Status: Phase 0 foundation implemented; domain phases require approved IMBA policy.

IMBA-OS is designed as a modular TypeScript monolith backed by one PostgreSQL database, one transactional outbox, and one worker process. Business changes enter through validated commands. A successful command writes an immutable event, its synchronous core projection, command status, and an outbox message in one database transaction. Asynchronous workers update reporting/search projections and external providers.

This directory is the binding architecture record. It deliberately separates technical implementation from IMBA policy:

- [OPEN_DOMAIN_QUESTIONS.md](./OPEN_DOMAIN_QUESTIONS.md) lists decisions that Magan, Kent, or another authorized IMBA owner must approve.
- [EVENT_SCHEMA_EVOLUTION.md](./EVENT_SCHEMA_EVOLUTION.md) defines versioning and upcasting rules.
- [PII_RETENTION_AND_ERASURE.md](./PII_RETENTION_AND_ERASURE.md) defines how immutable history coexists with erasure obligations.
- [ACCOUNTING_BOUNDARY.md](./ACCOUNTING_BOUNDARY.md) defines the accounting packet contract and QuickBooks boundary without deciding accounting policy.
- [PROJECTIONS_AND_OPERATIONS.md](./PROJECTIONS_AND_OPERATIONS.md) defines projection classes, rebuilds, replay, and operational controls.
- [TRAIL_SOLUTIONS_FINANCIAL_MANAGEMENT.md](./TRAIL_SOLUTIONS_FINANCIAL_MANAGEMENT.md) defines the workbook, management-read-model, and future ERP boundaries for Trail Solutions.

## Non-negotiable invariants

1. The ledger establishes server order using `ledger_position`; provider timestamps never do.
2. Event IDs and exposed entity IDs are UUIDv4. Stream versions enforce optimistic concurrency.
3. Immutable events contain references to encrypted PII, not searchable plaintext PII.
4. Money is integer minor units plus an ISO-style currency code. Floating-point money is rejected.
5. Every accounting conclusion identifies the approved policy and policy version that produced it.
6. Unknown event schema versions fail loudly. Upcasters are deterministic, contiguous, and side-effect free.
7. Offline activity records facts and authority status; it never invents legal, insurance, or eligibility authority.
8. QBO remains authoritative for the general ledger, closing, reconciliation, and financial statements.

## Phase order

| Phase | Scope | Entry condition |
| --- | --- | --- |
| 0 | Ledger, controls, registries, privacy, deterministic test harness | Implemented in this repository |
| 1 | Audit and operational controls | Production database and approved access model |
| 2 | Identity resolution | Approved identity and merge/reversal policy |
| 3 | Membership and chapter federation | Approved membership/chapter policies |
| 4 | Campaigns, payments, and accounting packets | Approved pledge, restriction, refund, and accounting policies |
| 5 | Consent and HubSpot | Approved consent/source-of-truth policy |
| 6 | Resolution workbench | Approved exception ownership and service levels |
| 7 | Offline verified workflows | Approved delegated-authority matrix |
| 8 | Analytics and mission outcomes | Stable operational data and approved metric definitions |

AI, GIS, Kafka, Kubernetes, and a generic workflow engine are explicitly outside the constituent core until scale or an approved use case justifies them.

## Completion standard

The production foundation is complete only when a small team can append an event, trace its correlation chain, rebuild and atomically switch a projection, replay an integration, reverse an identity merge, rotate or destroy PII keys, and reconcile or reverse an accounting packet using documented runbooks.
