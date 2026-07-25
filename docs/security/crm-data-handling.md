# CRM data handling and access control

## Least privilege

Capability contracts distinguish CRM viewer, CRM administrator, migration analyst,
mapping approver, finance reconciler, integration administrator, and audit viewer.
Constituent PII and financial detail are separate capabilities. The existing role
selector remains demonstration UI, not production authentication.

The repository has no production session/auth middleware yet. Therefore no live
CRM data or credentials may be enabled until an authenticated server context maps
users to organization, chapter scope, and capabilities.

## Tenant enforcement

Every canonical event requires organization ID and either a chapter ID or explicit
`NATIONAL` scope. The in-memory store requires organization-scoped reads and
prevents one stream crossing organizations. Migration `0002` enables PostgreSQL
RLS on the event ledger and all new operational projections. Trusted request code
must set `SET LOCAL imba.organization_id` from authenticated server context before
queries. Application checks remain required; RLS is defense in depth.

## PII and secrets

- Event payloads reject searchable plaintext PII keys and use encrypted PII
  references.
- Source evidence redacts names, emails, phones, and addresses.
- Raw authorized exports belong in controlled encrypted storage, not fixtures.
- API keys and Basic Auth headers stay server-side and are never logged.
- Payment credentials and card data are out of scope.
- Exports, merges, suppressions, financial adjustments, mapping approvals, and
  manual reconciliation decisions require audit events.

## Production enablement blockers

Before live read-only use: implement production authentication/session handling,
server tenant/capability enforcement, credential-vault integration, encrypted
constituent storage, audit review, retention/erasure operations, monitoring, and
an approved incident/revocation runbook. Production provider writes remain
disabled even after those read controls are complete.
