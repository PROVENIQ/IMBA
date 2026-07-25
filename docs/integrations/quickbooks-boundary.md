# QuickBooks boundary

QuickBooks remains the authoritative general ledger. IMBA-OS stores opaque
references to QuickBooks transactions, deposits, and journal entries; it does not
create a second ledger.

The reconciliation chain is:

`EveryAction contribution → EveryAction financial batch → processor settlement →
bank deposit → QuickBooks transaction reference`.

Each source can be missing, delayed, duplicated, adjusted, or differently
designated. The reconciliation domain preserves those differences with explicit
statuses and evidence. It never assumes that EveryAction automatically posts
donations to QuickBooks.

Current CRM Migration screens use a mock accounting source and synthetic references.
No QuickBooks or EveryAction production writes occur. A future read adapter must
implement `AccountingSourcePort`, remain organization-scoped, and expose
transactions, deposits, journal entries, and account reference data without
copying QuickBooks ledger authority.

Manual resolution appends an immutable `RECONCILIATION_CASE_RESOLVED` event with
actor, reason, evidence, three timestamps, and trace IDs. The original discrepancy
remains in event history.
