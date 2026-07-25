# Migration assurance

Migration assurance answers three separate questions: did every source record get
a disposition, did canonical transformation preserve meaning, and do destination
counts/amounts reconcile to the covered source?

## Evidence model

A `MigrationBatch` identifies one governed source export. Every `SourceRecord`
retains its export reference, opaque source ID, fingerprint, safe evidence,
versions, and disposition. A duplicate fingerprint is idempotent within
organization, source, and entity.

`FieldMapping` is versioned. It names source system/entity/field, canonical field,
destination system/entity/field, transform, validations, prerequisites,
confidence, proposal/approval actors, three timestamps, and version. A changed
mapping creates a new version and supersedes history through events; approval is
never overwritten.

Reusable validation covers required IDs and names, date and email formats, unknown
designations/source codes/statuses, orphans, duplicate IDs and people, amount
differences, recurring-payment coverage, asymmetric source/destination records,
suppression differences, truncation, invalid custom values, and unresolved
prerequisites.

Control totals retain both systems, exact filter criteria, entity/group, count,
minor-unit amount and currency, calculation version, source coverage, business
period, server ingestion time, result, and exact difference. Required groupings
include entity, month/year, campaign, designation, payment type, membership status,
chapter, and recurring status.

Exceptions are owned work with severity, failed rule, affected records, effect,
evidence, status, and append-only decisions. Projection rows may change for fast
queries, but they are rebuilt from the event ledger.

## Projection rebuild

`rebuildProjection` takes a versioned projection definition, an organization ID,
and ledger events. It sorts by ledger position, ignores other tenants, applies
handlers from an empty state, and returns its checkpoint. Rebuilds must be
validated before routing production reads to a new projection version.
