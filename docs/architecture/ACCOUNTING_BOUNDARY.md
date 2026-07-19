# Accounting Boundary

IMBA-OS records operational facts and produces reviewable accounting packets. QuickBooks Online (QBO) remains authoritative for the general ledger, close, reconciliation, and financial statements. A connection authorizes ongoing sync; it does not make every inbound value authoritative or remove the need for an auditable API exchange.

## Accounting packet contract

Every packet contains:

- `accountingPacketId`
- `sourceEventIds`
- `organizationId` and optional `chapterId`
- `correlationId` and optional `causationId`
- `policyId` and `policyVersion`
- `effectiveDate` and `currency`
- balanced debit/credit lines using integer minor units
- restriction and chapter dimensions
- optional `reversalOfPacketId`
- `approvalStatus`
- optional `qboPostingReference`

A packet cannot be released unless it balances, uses one currency, identifies its sources, and cites an approved policy version. The contract does not decide pledge recognition, agency treatment, deferred revenue, restriction release, mapping, refund, void, or rounding policy; those remain open until IMBA approves them.

## Lifecycle

```text
operational facts -> proposed packet -> policy validation -> approval -> outbox
-> QBO adapter -> provider acknowledgement -> reconciliation
```

- Reversals reference the original packet; posted packets are not edited into a different conclusion.
- QBO provider IDs, request/response evidence, timestamps, retry state, and reconciliation result are retained outside immutable business payloads when they may contain sensitive provider data.
- A failed or ambiguous provider response enters review. It does not silently create a second posting.
- Reports may use local synced QBO data for speed, but the UI must disclose source, sync freshness, period, and whether results are filed, synced, modeled, or proposed.

## Inbound provider decisions

Every inbound provider fact is evaluated under a versioned policy and produces one of:

- `AUTO_ACCEPT`
- `ACCEPT_AS_ADDITIONAL_VALUE`
- `REQUIRE_VERIFICATION`
- `REQUIRE_REVIEW`
- `REJECT`
- `TELEMETRY_ONLY`

The decision record retains provider event ID, source, evidence reference, provider and server timestamps, policy/version, outcome, explanation code, and any resulting IMBA event IDs. Provider time never defines ledger order.
