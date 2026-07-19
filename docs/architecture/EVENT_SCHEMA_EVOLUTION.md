# Event Schema Evolution

Events are permanent facts. Code evolves around them.

## Contract

- Each event type has a positive integer schema version.
- A registry declares the current version and one upcaster for every adjacent version (`1 -> 2`, `2 -> 3`, and so on).
- Upcasters are deterministic, synchronous, side-effect free, and do not read current projections, clocks, randomness, providers, or environment state.
- Upcasters may reshape recorded facts; they may not manufacture a business fact that was not present in the source event.
- Reading an unknown event type, a future version, or a missing link fails loudly and identifies the event ID, type, and version.
- Writers emit only the current version. Readers upcast from the stored version before applying a projection.
- Stored ledger rows are never rewritten after deploying a new schema.

## Release gate

Any event schema change must include:

1. A new current-version declaration.
2. The adjacent upcaster.
3. Historical fixtures for every supported stored version.
4. Determinism tests (the same bytes in produce the same value out).
5. Projection rebuild and integration replay tests.
6. A rollback statement explaining how old code behaves after deployment.

If an upcaster needs an unknown policy outcome, the release is blocked pending an approved domain decision. `null`, `unknown`, or an explicit legacy field may preserve uncertainty; a guessed value may not.

## Deprecation

Support for a stored version may be removed only after a verified ledger inventory proves that no event at that version remains unreadable by the replacement path and the retention/legal-hold policy permits the change. The evidence is retained with the release record.
