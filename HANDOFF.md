# IMBA-OS Handoff

Updated: 2026-07-19

## Current status

- Public prototype: <https://imba.pro-found.org>
- Local development: `npm run dev` on port 3910
- UI boundary: client-only pitch prototype with illustrative workflows; no production authentication, database, or live provider integrations
- Production-code boundary: Phase 0 architecture, PostgreSQL migration, typed contracts, and deterministic tests are implemented in this repository but are not connected to a production database

The distinction is deliberate: the PDF proposal tells IMBA what Terry would do; the prototype shows how it would work; neither may claim unbuilt integrations or unapproved IMBA policy as live fact.

## Phase 0 architecture

Start with [docs/architecture/README.md](./docs/architecture/README.md). The binding records include:

- Open IMBA policy decisions
- Event schema evolution and upcasting
- PII retention, encryption references, key destruction, and erasure
- Accounting packet/QBO authority boundary
- Projection rebuild, cutover, rollback, worker, and offline-authority controls

The initial PostgreSQL schema is [db/migrations/0001_phase_zero_foundation.sql](./db/migrations/0001_phase_zero_foundation.sql). Executable TypeScript contracts live under `src/core`; deterministic tests live under `tests`.

Do not connect domain handlers until the corresponding item in `OPEN_DOMAIN_QUESTIONS.md` has an authorized policy ID, version, owner, approver, and effective date.

## Architectural invariants

1. One modular TypeScript monolith, one PostgreSQL database, one outbox, and one worker until demonstrated scale requires more.
2. Validated registered commands only; rejected/unrecognized input is quarantined, not converted into a domain event.
3. Immutable events ordered by server-assigned ledger position, with UUIDv4 identity and optimistic stream version.
4. No searchable plaintext PII in immutable payloads. Historical PII is recoverable only through externally managed key context.
5. Money uses integer minor units and a currency code. JSON minor units are decimal strings; no floats or implicit FX.
6. Accounting packets cite approved policy and source events, balance before release, and are reversible rather than rewritten.
7. QBO is authoritative for the general ledger, closing, reconciliation, and financial statements.
8. Provider timestamps never establish ledger order. Provider facts produce a recorded, versioned policy outcome.
9. Offline workflows cannot assume legal, insurance, consent, accounting, or central authority.
10. Unknown event types/schema versions and missing upcasters fail loudly.

## Prototype honesty rules

- Filed public fact = `filed`; arithmetic on filed facts = `derived`; demonstration data = `illustrative`; unavailable fact = `unknown`.
- QBO and ADP are configured demo connectors. Other provider connectors remain planned unless code, credentials, and a verified end-to-end test prove otherwise.
- A one-time OAuth connection enables future background API sync; it does not eliminate API exchanges or make every provider value authoritative.
- Do not display personal names in role affordances. Use role labels.
- Do not add federal-award/Single Audit machinery as active for FY2024; IMBA reported no federal award expenditures.
- Kent is shown as CEO in the demo based on the filed return; do not silently substitute another title.

## Required verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

If a dev server locks `.next`, build from an isolated copy instead of killing an unrelated user process. Do not run `npm audit fix --force`; the currently suggested forced resolution would introduce an invalid breaking downgrade.

## Next production work

1. Approve database host, application/worker roles, authentication model, secrets management, backup targets, and recovery objectives.
2. Resolve the relevant open domain policies with IMBA.
3. Apply and smoke-test the migration against a non-production PostgreSQL database.
4. Implement Phase 1 audit/control services and a PostgreSQL event-store adapter with an end-to-end transaction test.
5. Proceed through identity, membership/chapter, payments/accounting, consent/HubSpot, resolution, offline, and analytics phases in the documented order.

No later phase should be labeled complete merely because a prototype screen exists.
