# Canonical CRM model

IMBA-OS uses provider-neutral concepts so staff do not inherit overlapping
EveryAction vocabulary.

- `Person`, `Household`, and constituent `Organization` represent identity.
- `Relationship` links canonical entities with direction and status.
- `ContactPoint` and `Address` reference encrypted PII contexts.
- `CommunicationConsent` records evidence of a channel choice.
- `Suppression` is a permission or legal restriction and takes precedence over
  delivery eligibility.
- `ExternalIdentity` links an opaque provider ID to an IMBA-OS UUID.
- `SourceAttribution` records acquisition or transaction origin.
- `Label` is a manually assigned organizational marker.
- `EngagementCode` represents a defined action, interest, or involvement.
- `Segment` is saved or dynamic selection criteria.
- `CustomFieldDefinition` and `CustomFieldValue` hold genuinely tenant-defined
  structured information.

EveryAction activist codes, source codes, groups, tags, and custom fields are
translated at the adapter/crosswalk boundary. They are not collapsed into one
untyped collection.

Membership owns terms, statuses, chapter affiliations, benefits, renewals, and
adjustments. Fundraising owns campaigns, designations, contributions and
adjustments, pledges, recurring commitments, and financial batches. Finance bridge
objects contain processor, bank, and QuickBooks references only.

All identifiers are branded UUIDv4 values. External IDs remain opaque strings.
Core changes are immutable events; disposable projections can be rebuilt by ledger
position for one organization.
