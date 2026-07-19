# Projections and Operations

## Projection classes

Synchronous core projections are updated in the same transaction as the event and command result:

- Constituent header
- Current membership
- Current chapter affiliation
- Current communication eligibility
- Command status

Asynchronous projections are disposable and rebuilt from the ledger:

- Analytics and reporting
- Search
- Provider exports
- History/timelines

Projection definitions record name, code version, schema version, active table, status, and checkpoint. Each checkpoint is a monotonic ledger position, never a timestamp.

## Rebuild and cutover

1. Create versioned shadow tables without replacing the active projection.
2. Replay events in ledger-position order from zero or a verified snapshot.
3. Record throughput, event count, last position, failures, and estimated completion against the approved rebuild SLO.
4. Validate row counts, invariants, sampled records, and aggregate control totals.
5. Pause or dual-apply the final delta, advance the shadow checkpoint to the ledger head, and validate again.
6. Atomically switch the projection route to the shadow version.
7. Keep the prior route available for rollback until the observation window closes.

An unknown event or schema stops the projection. Skipping is allowed only through an explicit, audited operational decision and never by a catch-all handler.

## Transaction boundary

A command succeeds only when one PostgreSQL transaction has:

1. Validated identity, authority, policy, expected stream version, and event schema.
2. Appended the immutable event with its server-assigned ledger position.
3. Applied required synchronous core projection changes.
4. Recorded command success.
5. Enqueued required outbox messages.

Rejected or unrecognized input is quarantined with evidence and is not represented as an accepted domain event.

## Worker and replay controls

- Workers claim outbox rows with `FOR UPDATE SKIP LOCKED` and bounded batches.
- Delivery is at least once; adapters use idempotency keys and provider reconciliation.
- Retries use bounded exponential backoff and a terminal review state.
- Replay may target one message, correlation chain, provider, or bounded ledger range.
- The operational view links command, event, projection checkpoint, outbox attempt, provider evidence, and accounting packet by correlation/causation IDs.

## Offline authority

Offline records carry one explicit status:

- `LOCAL_FACT_RECORDED`
- `PROVISIONAL_AUTHORITY_EXERCISED`
- `CENTRAL_ACCEPTANCE_REQUIRED`
- `EXTERNAL_CONFIRMATION_REQUIRED`

Only a centrally approved, versioned policy may delegate provisional authority. Offline software never assumes insurance coverage, legal eligibility, consent, accounting approval, or central acceptance.

## Initial service targets to approve

The implementation must measure rebuild throughput, lag, error rate, oldest pending outbox age, and reconciliation age. Numeric SLOs are intentionally unset until IMBA approves data volumes, operating hours, recovery objectives, and staffing.
