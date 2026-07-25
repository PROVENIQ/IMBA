# Financial reconciliation

Reconciliation is provider-neutral and preserves the independent evidence from
EveryAction, payment processor, bank, and QuickBooks.

Statuses are `MATCHED`, `TIMING_DIFFERENCE`, `AMOUNT_DIFFERENCE`,
`MISSING_IN_QUICKBOOKS`, `MISSING_IN_EVERYACTION`,
`MISSING_PROCESSOR_SETTLEMENT`, `MISSING_BANK_DEPOSIT`,
`DESIGNATION_MISMATCH`, `DUPLICATE`, `REFUND_OR_ADJUSTMENT`,
`REQUIRES_REVIEW`, and `RESOLVED`.

The engine compares exact minor-unit money values. A timing difference is not
silently treated as a match, and a refund or adjustment does not erase the
original contribution. Each case retains source references and evidence.

Resolution is append-only. It requires the same organization, a non-empty reason,
an evidence reference, actor, `occurredAt`, server `ingestedAt` and `recordedAt`,
correlation ID, and causation ID. The read model may show `RESOLVED`; replay still
reveals the original case and every resolution.

The demonstration's rows and drilldowns are synthetic and make no claim about
IMBA's actual processor, bank, QuickBooks, or EveryAction configuration.
