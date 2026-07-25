# CiviCRM migration source

CiviCRM is treated as a historical migration source. The initial adapter is
CSV-first so source exports can be inspected, fingerprinted, validated, and
reconciled without coupling the migration domain to CiviCRM's API.

The source contract supports contacts, addresses, email addresses, phone numbers,
relationships, groups, memberships, contributions, pledges, recurring
contributions, events, participants, activities, custom fields, and communication
preferences. Each file is registered as a named source entity and a stable export
identifier.

Every parsed row produces a source envelope with:

- source system, entity, original CiviCRM identifier and export identifier;
- source occurrence time when supplied and a server ingestion time;
- deterministic fingerprint;
- safely redacted evidence snapshot;
- transform and mapping versions; and
- an explicit disposition.

The adapter's initial disposition is `STAGED`. Downstream validation must turn each
row into `MATCHED`, `TRANSFORMED`, `REJECTED`, or `QUARANTINED`; silent dropping is
not permitted. Original CiviCRM IDs become `ExternalIdentity` records and never
replace IMBA-OS UUIDv4 identifiers.

CSV parsing handles quoted delimiters, escaped quotes, CRLF/LF records, and missing
cells. PII-like columns are redacted in source evidence. Authorized raw exports
must live in controlled encrypted storage, never the repository.

Control totals report row count and exact minor-unit amount totals. No unexplained
difference is rounded away.

An APIv4 source can later implement the same `MigrationSourcePort` without changing
crosswalks, validation, events, or operator screens.

All demonstration records are generated deterministically in
`src/lib/imba-crm-migration-data.ts`. Reloading the screen resets drawer-local
decisions; the app-wide existing demo reset remains available for persisted
prototype state.
