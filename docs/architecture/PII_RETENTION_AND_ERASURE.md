# PII Retention and Erasure

The immutable ledger and a person's erasure rights are compatible only when the ledger does not depend on permanent searchable plaintext PII.

## Storage model

- Domain events store opaque `piiContextId` or typed PII references.
- PII values are encrypted outside the event payload with a per-context key or envelope-key reference. Key material is never stored in PostgreSQL.
- External key identifiers and cryptographic context are operational metadata, not the secret itself.
- Searchable/current projections contain only the minimum fields required for their approved purpose.
- Application logs, analytics, traces, dead-letter payloads, and outbox metadata must redact PII by default.
- Providers receive only the fields permitted by an approved purpose and data-processing agreement.

## Erasure workflow

1. Record the request and verify the subject without adding new PII to the ledger.
2. Resolve legal holds and retention exceptions through an authorized reviewer.
3. Stop new processing and remove the context from active projections.
4. Request deletion from providers, exports, caches, search indexes, and operational replicas.
5. Destroy or rotate the external encryption key so historical ciphertext is no longer recoverable.
6. Rebuild affected projections and verify that PII cannot be resolved.
7. Track backup expiry; do not restore erased keys or values during disaster recovery.
8. Append a non-PII completion event/reference containing request ID, scope, policy, approver, timestamps, and evidence locations.

The completion record proves that an erasure process occurred; it must not identify the subject directly.

## Legal holds

Legal holds are explicit, scoped, time-bounded when possible, and reviewable. A hold pauses destructive steps only for covered data and records the authorizing policy and approver. It does not silently convert optional data into permanent data.

## Backups and exports

- Backup schedules must have documented maximum retention and tested expiry.
- Restores run a post-restore erasure reconciliation before serving traffic.
- Export manifests identify purpose, recipient, fields, creation, expiry, deletion status, and key context.
- Provider deletion is complete only when acknowledged or escalated under the provider runbook.

## Required controls before production PII

- Approved retention matrix and legal-hold policy.
- External key management with rotation, destruction, access logging, and recovery controls.
- PII inventory and automated payload/log scanning.
- Provider deletion adapters and evidence capture.
- A full erasure rehearsal including backup-restore reconciliation.
