# Open IMBA Domain Questions

These are business-policy decisions, not software defaults. The implementation must not infer an answer from the prototype, historical data, provider behavior, or common nonprofit practice. Each answer requires an owner, approval date, effective date, policy ID, and version before it may authorize a production command.

## Membership

- What membership terms exist, and how do start, renewal, grace, lapse, reinstatement, and cancellation work?
- Which tiers exist, what benefits attach to each tier, and which benefits require verification?
- What prices, discounts, waivers, proration, refunds, and tax treatments are authorized?
- Which system is authoritative for membership status, and which roles may override it?

## Chapters and federation

- How are dues, donations, fees, and expenses allocated between IMBA and chapters?
- Which decisions may chapters make independently, provisionally, or only with central approval?
- What data may IMBA and chapters share, for which purposes, and for how long?
- How are chapter moves, dual affiliations, mergers, closures, and disputed affiliations handled?

## Insurance and eligibility

- Which activities, people, chapters, events, and time periods are eligible for coverage?
- What evidence is required, who may approve eligibility, and when may a decision be revoked?
- Which offline facts may be collected without implying legal eligibility or insurance coverage?

## Consent and communications

- What consent categories, lawful bases, channels, jurisdictions, and age restrictions apply?
- Which provider is authoritative when IMBA-OS, HubSpot, email, forms, and a chapter disagree?
- How are withdrawal, suppression, proof, expiration, and re-consent handled?

## Donations, restrictions, and pledges

- Which donor restrictions and designations are accepted, and who can release or redirect them?
- When does a pledge become an enforceable receivable versus an intent or forecast?
- How are conditional, recurring, in-kind, anonymous, matched, failed, refunded, and disputed gifts represented?
- How are processor fees, chargebacks, and chapter pass-through amounts allocated?

## Accounting

- Which approved policy determines agency versus principal treatment and revenue recognition?
- When are membership amounts recognized, deferred, released, refunded, or written off?
- What chart-of-accounts, class, customer/project, restriction, chapter, and campaign mappings apply?
- What rounding and remainder allocation policy applies to each calculation?
- Who approves, releases, reverses, and re-posts accounting packets, and what periods may be reopened?

## Retention, erasure, and legal holds

- What retention period applies to each data class, jurisdiction, provider, export, backup, and log?
- Which records are subject to legal, grant, tax, insurance, employment, or litigation holds?
- Who may approve erasure, key destruction, exception, restoration, and completion attestation?
- What non-PII proof of erasure must remain, and for how long?

## Decision record format

Every resolved item must be recorded as:

```text
Policy ID:
Version:
Owner:
Approver:
Decision:
Effective date:
Applies to:
Exceptions:
Required evidence:
Migration impact:
Review date:
```
