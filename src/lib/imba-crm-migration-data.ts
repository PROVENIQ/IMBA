export const CRM_SYNTHETIC_BANNER =
  "Synthetic demonstration data — not connected to IMBA systems.";

export function syntheticUuid(index: number): string {
  const tail = index.toString(16).padStart(12, "0").slice(-12);
  return `5eed0000-0000-4000-8000-${tail}`;
}

const firstNames = [
  "Avery", "Blake", "Cameron", "Devon", "Emery", "Finley", "Harper", "Indigo",
  "Jordan", "Kai", "Logan", "Morgan", "Noel", "Parker", "Quinn", "Reese",
];
const lastNames = [
  "Ash", "Brooks", "Cedar", "Dale", "Ellis", "Fields", "Green", "Hayes",
  "Iverson", "Jules", "Kendall", "Lane", "Monroe", "North", "Oakley", "Pine",
];

export interface SyntheticConstituent {
  id: string;
  name: string;
  chapter: string;
  membership: "CURRENT" | "LAPSED" | "PROSPECT";
  civiId: string;
  everyActionId?: string;
  suppressed: boolean;
}

export const syntheticConstituents: readonly SyntheticConstituent[] = Array.from(
  { length: 640 },
  (_, index) => ({
    id: syntheticUuid(index + 1),
    name: `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / 4) % lastNames.length]} ${index + 1}`,
    chapter: index % 5 === 0 ? "National" : `Synthetic Chapter ${(index % 12) + 1}`,
    membership: index % 9 === 0 ? "LAPSED" : index % 7 === 0 ? "PROSPECT" : "CURRENT",
    civiId: `CIVI-${10000 + index}`,
    everyActionId: index % 23 === 0 ? undefined : `EA-${80000 + index}`,
    suppressed: index % 31 === 0,
  }),
);

export const migrationHealth = {
  completion: 92,
  discoveredEntities: 15,
  staged: 1842,
  validated: 1769,
  matched: 1697,
  rejected: 11,
  unresolvedMappings: 4,
  unresolvedExceptions: 7,
  controlDifferences: 3,
  recurringValidated: 86,
};

export const domainReadiness = [
  { domain: "Constituents", percent: 97, status: "READY", note: "Identity links and suppressions validated" },
  { domain: "Memberships", percent: 84, status: "DECISION", note: "One status crosswalk needs leadership direction" },
  { domain: "Contributions", percent: 94, status: "WATCH", note: "Three financial control differences remain" },
  { domain: "Recurring commitments", percent: 91, status: "WATCH", note: "Eight histories need review" },
  { domain: "Relationships", percent: 88, status: "WATCH", note: "Twelve orphan references quarantined" },
] as const;

export const crosswalkRows = [
  { id: "MAP-101", entity: "contacts", source: "contact_id", canonical: "ExternalIdentity.externalId", destination: "Contacts.externalId", transform: "String · trim", prerequisites: "None", validation: "Unique within CIVICRM", status: "APPROVED", confidence: 100, owner: "Migration analyst", version: 3 },
  { id: "MAP-102", entity: "memberships", source: "status_id", canonical: "MembershipStatus", destination: "CustomField.MemberStatus", transform: "Lookup table", prerequisites: "Membership type", validation: "Known canonical status", status: "REQUIRES_DECISION", confidence: 64, owner: "Leadership", version: 2 },
  { id: "MAP-103", entity: "contributions", source: "financial_type_id", canonical: "Designation", destination: "Designations.designationId", transform: "Approved crosswalk", prerequisites: "Designation registry", validation: "Destination exists", status: "APPROVED", confidence: 96, owner: "Development ops", version: 5 },
  { id: "MAP-104", entity: "contributions", source: "source", canonical: "SourceAttribution", destination: "SourceCodes.sourceCodeId", transform: "Normalize + lookup", prerequisites: "Source code catalog", validation: "Known source code", status: "PROPOSED", confidence: 78, owner: "Development ops", version: 1 },
  { id: "MAP-105", entity: "groups", source: "group_id", canonical: "Label or Segment", destination: "ActivistCodes / SupporterGroups", transform: "Decision table", prerequisites: "Semantic classification", validation: "Exactly one canonical meaning", status: "REQUIRES_DECISION", confidence: 52, owner: "CRM administrator", version: 4 },
  { id: "MAP-106", entity: "contacts", source: "do_not_email", canonical: "Suppression.EMAIL", destination: "Contacts.doNotEmail", transform: "Boolean", prerequisites: "None", validation: "Suppression preserved", status: "APPROVED", confidence: 100, owner: "Privacy owner", version: 2 },
  { id: "MAP-107", entity: "relationships", source: "relationship_type_id", canonical: "Relationship.kind", destination: "Relationships.relationshipTypeId", transform: "Lookup + direction", prerequisites: "Both contacts matched", validation: "No orphan references", status: "PROPOSED", confidence: 81, owner: "Migration analyst", version: 1 },
  { id: "MAP-108", entity: "custom_fields", source: "preferred_trail_role", canonical: "CustomFieldValue", destination: "CustomFields.value", transform: "Enum mapping", prerequisites: "Field schema", validation: "Allowed value", status: "REJECTED", confidence: 38, owner: "Data steward", version: 2 },
] as const;

export const initialExceptions = [
  { id: "EXC-401", severity: "HIGH", source: "Contribution CIVI-8821", destination: "EveryAction contribution staging", rule: "MISSING_DESIGNATION", effect: "$1,250 cannot enter batch control total", suggestion: "Map the legacy financial type to a synthetic designation", owner: "Development ops", age: "2 days", evidence: "Source row + financial type catalog", status: "OPEN", history: ["VALIDATION_EXCEPTION_OPENED · Jul 22 · IMBA-OS"] },
  { id: "EXC-402", severity: "HIGH", source: "Recurring contribution CIVI-RC-119", destination: "EveryAction commitment", rule: "PAYMENT_HISTORY_MISSING", effect: "Renewal value cannot be certified", suggestion: "Confirm source export coverage or waive with evidence", owner: "Finance reconciler", age: "3 days", evidence: "Recurring export + contribution history", status: "ASSIGNED", history: ["VALIDATION_EXCEPTION_OPENED · Jul 21 · IMBA-OS", "EXCEPTION_ASSIGNED · Jul 22 · Analyst"] },
  { id: "EXC-403", severity: "MEDIUM", source: "Contact CIVI-10342", destination: "EveryAction contact EA-80311", rule: "SUPPRESSION_DIFFERENCE", effect: "Email eligibility could be overstated", suggestion: "Preserve the source email suppression", owner: "Privacy owner", age: "1 day", evidence: "Consent comparison", status: "OPEN", history: ["VALIDATION_EXCEPTION_OPENED · Jul 23 · IMBA-OS"] },
  { id: "EXC-404", severity: "MEDIUM", source: "Relationship CIVI-REL-71", destination: "Canonical relationship", rule: "ORPHANED_RELATIONSHIP", effect: "Household link quarantined", suggestion: "Locate or explicitly reject the missing contact", owner: "Migration analyst", age: "5 days", evidence: "Relationship source row", status: "OPEN", history: ["VALIDATION_EXCEPTION_OPENED · Jul 19 · IMBA-OS"] },
  { id: "EXC-405", severity: "LOW", source: "Contact CIVI-10420", destination: "EveryAction contact candidate", rule: "PROBABLE_DUPLICATE", effect: "Potential duplicate outreach", suggestion: "Review name, postal code, and redacted contact evidence", owner: "CRM administrator", age: "4 hours", evidence: "Match score 0.78", status: "OPEN", history: ["RECONCILIATION_CASE_OPENED · Jul 24 · IMBA-OS"] },
  { id: "EXC-406", severity: "MEDIUM", source: "Membership CIVI-M-553", destination: "EveryAction custom field", rule: "UNKNOWN_MEMBERSHIP_STATUS", effect: "Membership cannot be certified", suggestion: "Complete the leadership status mapping decision", owner: "Leadership", age: "6 days", evidence: "Status crosswalk MAP-102", status: "BLOCKED", history: ["VALIDATION_EXCEPTION_OPENED · Jul 18 · IMBA-OS"] },
  { id: "EXC-407", severity: "LOW", source: "Custom field CIVI-CF-14", destination: "EveryAction custom field", rule: "TRUNCATED_VALUE", effect: "Long-form preference note needs archival treatment", suggestion: "Retain canonical value and send a shortened delivery value", owner: "Data steward", age: "1 day", evidence: "Schema length comparison", status: "OPEN", history: ["VALIDATION_EXCEPTION_OPENED · Jul 23 · IMBA-OS"] },
] as const;

export const reconciliationRows = [
  { id: "REC-701", batch: "EA-BATCH-2407-A", contributions: 48250, processor: 48250, bank: 48250, quickbooks: 47000, difference: -1250, timing: "Same day", status: "AMOUNT_DIFFERENCE", caseId: "CASE-101", transactions: ["Gift SYN-1401 · $1,250 · designation mapping missing", "Gift SYN-1402 · $47,000 · matched"] },
  { id: "REC-702", batch: "EA-BATCH-2407-B", contributions: 32780, processor: 32780, bank: 32780, quickbooks: 32780, difference: 0, timing: "T+1", status: "MATCHED", caseId: "—", transactions: ["46 synthetic card contributions · matched"] },
  { id: "REC-703", batch: "EA-BATCH-2407-C", contributions: 18640, processor: 18140, bank: 18140, quickbooks: 18140, difference: -500, timing: "T+2", status: "REFUND_OR_ADJUSTMENT", caseId: "CASE-103", transactions: ["Gift SYN-1519 · $500 refund pending in EveryAction", "22 other synthetic gifts · matched"] },
  { id: "REC-704", batch: "EA-BATCH-2407-D", contributions: 9150, processor: 9150, bank: 0, quickbooks: 0, difference: -9150, timing: "Settlement pending 2 days", status: "MISSING_BANK_DEPOSIT", caseId: "CASE-104", transactions: ["Synthetic processor settlement PS-2204 · bank trace pending"] },
  { id: "REC-705", batch: "EA-BATCH-2407-E", contributions: 26400, processor: 26400, bank: 26400, quickbooks: 26400, difference: 0, timing: "T+1", status: "MATCHED", caseId: "—", transactions: ["31 synthetic ACH contributions · matched"] },
] as const;

export const integrationReadiness = [
  { connector: "CiviCRM source", status: "MOCK", capability: "CSV-first migration source", strategy: "MANUAL_EXPORT", note: "15 synthetic entity files; APIv4 can be added behind the same port" },
  { connector: "EveryAction API", status: "NOT_CONFIGURED", capability: "Server-side Basic Auth", strategy: "READ_ONLY", note: "No credential required for this demonstration" },
  { connector: "EveryAction changed entities", status: "MOCK", capability: "Polling workflow + durable cursor", strategy: "CHANGED_ENTITY_EXPORT", note: "Only documented resources are marked supported" },
  { connector: "EveryAction bulk import", status: "WRITE_DISABLED", capability: "Fail-closed interface", strategy: "BULK_EXPORT_JOB", note: "Requires flag, credential, approval, preview, audit event, and idempotency key" },
  { connector: "QuickBooks", status: "MOCK", capability: "Reference-only GL transaction reads", strategy: "PERIODIC_SNAPSHOT", note: "QuickBooks remains authoritative for the general ledger" },
  { connector: "Payment processor", status: "MOCK", capability: "Settlement reference data", strategy: "PERIODIC_SNAPSHOT", note: "No payment-card data is stored or processed" },
  { connector: "Bank data", status: "MOCK", capability: "Deposit reference data", strategy: "PERIODIC_SNAPSHOT", note: "Synthetic deposits only" },
] as const;

const readinessDomains = [
  "Constituent records", "Households and organizations", "Relationships", "Memberships",
  "Chapter affiliations", "Contributions", "Pledges", "Recurring commitments",
  "Designations", "Campaigns", "Events", "Volunteer participation", "Forms",
  "Segmentation", "Communication consent", "Email delivery", "SMS delivery",
  "Payment processing", "Reporting", "Exports", "Duplicate management",
  "Data administration", "Access control", "Audit history",
] as const;

export const replacementReadiness = readinessDomains.map((domain, index) => ({
  domain,
  everyActionUse: "UNKNOWN",
  sourceOfTruth: index < 15 ? "EveryAction · requires discovery" : index < 18 ? "External service · unknown" : "Shared · requires discovery",
  implementation: index < 6 ? "FOUNDATION" : index < 15 ? "PLANNED" : "NOT_STARTED",
  dataParity: index < 4 ? "SHADOW TESTING" : "NOT PROVEN",
  workflowParity: "NOT PROVEN",
  securityReview: index < 2 ? "IN PROGRESS" : "NOT STARTED",
  userAcceptance: "NOT STARTED",
  cutover: "NOT ELIGIBLE",
  rollback: "Retain EveryAction authority and replay canonical events",
  dependencies: index === 15 || index === 16 ? "Delivery provider selection" : "IMBA usage discovery + owner acceptance",
}));
