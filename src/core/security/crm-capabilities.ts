export const CRM_CAPABILITIES = [
  "CRM_VIEW",
  "CRM_ADMINISTER",
  "MIGRATION_ANALYZE",
  "MAPPING_APPROVE",
  "FINANCE_RECONCILE",
  "INTEGRATION_ADMINISTER",
  "AUDIT_VIEW",
  "CONSTITUENT_PII_VIEW",
  "FINANCIAL_DETAIL_VIEW",
] as const;

export type CrmCapability = (typeof CRM_CAPABILITIES)[number];

export const CRM_ROLE_CAPABILITIES = {
  CRM_VIEWER: ["CRM_VIEW"],
  CRM_ADMINISTRATOR: ["CRM_VIEW", "CRM_ADMINISTER", "CONSTITUENT_PII_VIEW"],
  MIGRATION_ANALYST: ["CRM_VIEW", "MIGRATION_ANALYZE"],
  MAPPING_APPROVER: ["CRM_VIEW", "MIGRATION_ANALYZE", "MAPPING_APPROVE"],
  FINANCE_RECONCILER: ["CRM_VIEW", "FINANCE_RECONCILE", "FINANCIAL_DETAIL_VIEW"],
  INTEGRATION_ADMINISTRATOR: ["CRM_VIEW", "INTEGRATION_ADMINISTER"],
  AUDIT_VIEWER: ["CRM_VIEW", "AUDIT_VIEW"],
} as const satisfies Record<string, readonly CrmCapability[]>;

export type CrmRole = keyof typeof CRM_ROLE_CAPABILITIES;

export function hasCrmCapability(role: CrmRole, capability: CrmCapability): boolean {
  return (CRM_ROLE_CAPABILITIES[role] as readonly CrmCapability[]).includes(capability);
}
