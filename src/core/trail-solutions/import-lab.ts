import type {
  ImportAttemptId,
  ImportVersionId,
  MappingTemplateId,
  TestWorkspaceId,
} from "@/core/primitives/identity";
import type {
  ProjectDetail,
  TrailSolutionsSnapshot,
} from "@/core/trail-solutions/model";

export const TEST_DATA_BANNER = "Test Data — Not an Accounting System of Record";

export type TrailDataEnvironment =
  | "synthetic-demonstration"
  | "uploaded-test"
  | "validated-production-derived";

export type ImportTableName =
  | "Project Master"
  | "Project Crosswalk"
  | "Estimate Lines"
  | "Labor Actuals"
  | "Nonlabor Actuals"
  | "Revenue & Billing"
  | "Change Orders"
  | "Operational Drivers"
  | "Grant Funding"
  | "Labor Rate Library"
  | "Cost Code Map"
  | "Project Summary"
  | "Benchmark Library";

export type ImportIssueSeverity = "error" | "warning" | "information";
export type ImportReadiness = "ready" | "warnings" | "blocked";
export type ImportWorkspaceMode = "create" | "replace" | "add";

export interface ImportFieldSpec {
  readonly field: string;
  readonly required: boolean;
  readonly kind: "identifier" | "text" | "date" | "number" | "boolean";
  readonly aliases?: readonly string[];
}

export interface ImportTableSpec {
  readonly name: ImportTableName;
  readonly requiredForAnalysis: boolean;
  readonly fields: readonly ImportFieldSpec[];
  readonly fileAliases: readonly string[];
}

const field = (
  name: string,
  kind: ImportFieldSpec["kind"],
  required = false,
  aliases: readonly string[] = [],
): ImportFieldSpec => Object.freeze({ field: name, kind, required, aliases });

export const IMPORT_TABLE_SPECS: readonly ImportTableSpec[] = Object.freeze([
  {
    name: "Project Master",
    requiredForAnalysis: true,
    fileAliases: ["projects", "project-master", "project master"],
    fields: [
      field("Project ID", "identifier", true, ["project code", "job id", "job code"]),
      field("Project Name", "text", true, ["job name"]),
      field("Business Line", "text", false, ["department", "service line"]),
      field("Customer / Funder", "text", false, ["client", "customer", "funder"]),
      field("Region", "text"), field("State", "text"),
      field("Project Manager", "text", false, ["pm", "manager"]),
      field("Contract Type", "text"), field("Funding Type", "text"),
      field("Original Contract Value ($)", "number", false, ["contract value", "original contract value"]),
      field("Start Date", "date"), field("Completion Date", "date", false, ["expected completion date"]),
      field("Trail Miles", "number"), field("Status", "text"),
      field("Data Quality Grade", "text"), field("Historical QBO Job", "identifier"),
      field("ADP Job Code", "identifier"), field("Monday.com Item ID", "identifier"),
      field("Contract / Proposal No.", "identifier"), field("Notes", "text"),
    ],
  },
  {
    name: "Project Crosswalk",
    requiredForAnalysis: false,
    fileAliases: ["crosswalk", "project-crosswalk"],
    fields: [field("Project ID", "identifier", true), field("Source System", "text", true), field("Source Entity Type", "text"), field("Source ID / Code", "identifier", true), field("Source Name", "text"), field("Effective From", "date"), field("Effective To", "date"), field("Mapping Status", "text"), field("Reviewed By", "text"), field("Notes", "text")],
  },
  {
    name: "Estimate Lines",
    requiredForAnalysis: false,
    fileAliases: ["estimates", "estimate-lines"],
    fields: [field("Project ID", "identifier", true), field("Estimate Version", "text"), field("Estimate Date", "date"), field("Line No.", "number"), field("Business Line", "text"), field("Project Phase", "text"), field("Cost Type", "text", true, ["cost category"]), field("Resource Role / Item", "text"), field("Quantity", "number"), field("Unit", "text"), field("Unit Cost ($)", "number"), field("Estimated Cost ($)", "number", true, ["estimated cost"]), field("Proposed Price ($)", "number"), field("Assumption / Scope Note", "text"), field("Approval Status", "text"), field("Approved Date", "date"), field("Source Document", "text")],
  },
  {
    name: "Labor Actuals",
    requiredForAnalysis: false,
    fileAliases: ["labor", "labor-actuals", "time detail"],
    fields: [field("Project ID", "identifier", true), field("Employee / Resource", "identifier"), field("Role", "text"), field("Region", "text"), field("Work Date", "date"), field("Pay Period End", "date"), field("Hours", "number"), field("Base Rate ($/hr)", "number"), field("Direct Wages ($)", "number"), field("Employer Taxes ($)", "number"), field("Benefits ($)", "number"), field("Other Burden ($)", "number"), field("Fully Burdened Labor Cost ($)", "number", true, ["labor cost"]), field("ADP Job Code", "identifier"), field("Project Phase", "text"), field("Cost Code", "identifier"), field("Source Record ID", "identifier"), field("Notes", "text")],
  },
  {
    name: "Nonlabor Actuals",
    requiredForAnalysis: false,
    fileAliases: ["nonlabor", "non-labor", "expenses", "nonlabor-actuals"],
    fields: [field("Project ID", "identifier", true), field("Vendor / Payee", "text"), field("Business Date", "date"), field("Accounting Date", "date"), field("Document No.", "identifier"), field("Source System", "text"), field("GL Account", "identifier"), field("Cost Type", "text", true, ["cost category"]), field("Direct / Indirect", "text"), field("Project Phase", "text"), field("Cost Code", "identifier"), field("Quantity", "number"), field("Unit", "text"), field("Unit Cost ($)", "number"), field("Amount ($)", "number", true, ["amount"]), field("Description", "text"), field("Source Record ID", "identifier"), field("Support Status", "text"), field("Notes", "text")],
  },
  {
    name: "Revenue & Billing",
    requiredForAnalysis: false,
    fileAliases: ["revenue", "billing", "revenue-billing", "invoices"],
    fields: [field("Project ID", "identifier", true), field("Record Type", "text"), field("Document Date", "date"), field("Due Date", "date"), field("Document No.", "identifier"), field("Customer / Funding Source", "text"), field("Contract Value ($)", "number"), field("Invoice Amount ($)", "number"), field("Revenue Recognized ($)", "number"), field("Cash Collected ($)", "number"), field("Reimbursement Requested ($)", "number"), field("Reimbursement Received ($)", "number"), field("Outstanding AR ($)", "number"), field("Source System", "text"), field("Notes", "text")],
  },
  {
    name: "Change Orders",
    requiredForAnalysis: false,
    fileAliases: ["change-orders", "change order", "scope changes"],
    fields: [field("Project ID", "identifier", true), field("Change No.", "identifier"), field("Identified Date", "date"), field("Approved Date", "date"), field("Description", "text"), field("Cause", "text"), field("Status", "text"), field("Additional Revenue ($)", "number"), field("Additional Estimated Cost ($)", "number"), field("Schedule Days", "number"), field("Customer Approved?", "boolean"), field("Approval Owner", "text"), field("Net Financial Impact ($)", "number"), field("Source Document", "text")],
  },
  {
    name: "Operational Drivers",
    requiredForAnalysis: false,
    fileAliases: ["drivers", "operational-drivers", "operations"],
    fields: [field("Project ID", "identifier", true), field("Snapshot / Final Date", "date"), field("Business Line", "text"), field("Trail Miles", "number"), field("Terrain Class", "text"), field("Site Access Complexity", "text"), field("Site Visits", "number"), field("Stakeholder Meetings", "number"), field("Design Revisions", "number"), field("Permitting Complexity", "text"), field("Crew Size", "number"), field("Crew Days", "number"), field("Equipment Days", "number"), field("Signs Designed", "number"), field("Signs Fabricated", "number"), field("Signs Installed", "number"), field("Travel Miles", "number"), field("Lodging Nights", "number"), field("Subcontractor Count", "number"), field("Weather Delay Days", "number"), field("Customer Delay Days", "number"), field("Project Duration Days", "number"), field("Notes", "text")],
  },
  {
    name: "Grant Funding",
    requiredForAnalysis: false,
    fileAliases: ["grants", "grant-funding", "awards"],
    fields: [field("Project ID", "identifier", true), field("Grant / Award ID", "identifier"), field("Funder", "text"), field("Grant Type", "text"), field("Restricted?", "boolean"), field("Award Amount ($)", "number"), field("Start Date", "date"), field("End Date", "date"), field("Reimbursement Basis", "text"), field("Match Type", "text"), field("Match Requirement ($)", "number"), field("Eligible Cost to Date ($)", "number"), field("Reimbursements Requested ($)", "number"), field("Reimbursements Received ($)", "number"), field("Remaining Award ($)", "number"), field("Match Documented ($)", "number"), field("Indirect Rate", "number"), field("Reporting Frequency", "text"), field("Next Report Due", "date"), field("Notes", "text")],
  },
  {
    name: "Labor Rate Library",
    requiredForAnalysis: false,
    fileAliases: ["labor-rates", "rates"],
    fields: [field("Role", "text", true), field("Region", "text"), field("Effective From", "date"), field("Effective To", "date"), field("Compensation Basis", "text"), field("Annualized Base Compensation ($)", "number"), field("Annual Employer Taxes ($)", "number"), field("Annual Benefits ($)", "number"), field("Annual Other Burden ($)", "number"), field("Productive Hours", "number"), field("Direct Hourly Cost ($)", "number"), field("Fully Burdened Hourly Cost ($)", "number"), field("Billing Rate ($)", "number"), field("Source / Approval", "text"), field("Notes", "text")],
  },
  {
    name: "Cost Code Map",
    requiredForAnalysis: false,
    fileAliases: ["cost-codes", "cost-code-map"],
    fields: [field("Source System", "text"), field("Source Code", "identifier", true), field("Source Description", "text"), field("Standard Business Line", "text"), field("Standard Project Phase", "text"), field("Standard Cost Type", "text", true), field("Direct / Indirect", "text"), field("Effective From", "date"), field("Effective To", "date"), field("Mapping Status", "text"), field("Approved By", "text"), field("Notes", "text")],
  },
  {
    name: "Project Summary",
    requiredForAnalysis: false,
    fileAliases: ["project-summary", "forecast", "project financial summary"],
    fields: [field("Project ID", "identifier", true), field("Estimate to Complete ($)", "number"), field("Forecast / Final Cost ($)", "number"), field("Forecast Margin ($)", "number"), field("Forecast Margin %", "number")],
  },
  {
    name: "Benchmark Library",
    requiredForAnalysis: false,
    fileAliases: ["benchmarks", "benchmark-library"],
    fields: [field("Business Line", "text", true), field("Metric / Driver", "text", true), field("Unit", "text"), field("Sample Count", "number"), field("Low / P25", "number"), field("Median", "number"), field("High / P75", "number"), field("Recommended Standard", "number"), field("Confidence", "text"), field("Effective Date", "date"), field("Approved By", "text"), field("Source Project Set", "text"), field("Notes", "text")],
  },
]);

export function normalizedImportKey(value: string): string {
  return value.toLowerCase().replace(/[$%]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function importTableSpec(name: ImportTableName): ImportTableSpec {
  const spec = IMPORT_TABLE_SPECS.find((candidate) => candidate.name === name);
  if (!spec) throw new TypeError(`Unsupported import table: ${name}`);
  return spec;
}

export function detectImportTableName(value: string): ImportTableName | null {
  const normalized = normalizedImportKey(value.replace(/\.(xlsx|xlsm|csv)$/i, ""));
  for (const spec of IMPORT_TABLE_SPECS) {
    if (normalizedImportKey(spec.name) === normalized) return spec.name;
    if (spec.fileAliases.some((alias) => normalizedImportKey(alias) === normalized)) return spec.name;
  }
  return null;
}

export function proposeImportField(table: ImportTableName, sourceHeader: string): { field: string | null; confidence: "high" | "low" } {
  const key = normalizedImportKey(sourceHeader);
  const spec = importTableSpec(table);
  const exact = spec.fields.find((candidate) => normalizedImportKey(candidate.field) === key);
  if (exact) return { field: exact.field, confidence: "high" };
  const alias = spec.fields.find((candidate) => candidate.aliases?.some((value) => normalizedImportKey(value) === key));
  if (alias) return { field: alias.field, confidence: "high" };
  const partial = spec.fields.filter((candidate) => {
    const candidateKey = normalizedImportKey(candidate.field);
    return key.length >= 5 && (candidateKey.includes(key) || key.includes(candidateKey));
  });
  return partial.length === 1 ? { field: partial[0].field, confidence: "low" } : { field: null, confidence: "low" };
}

export interface ImportFileDescriptor {
  readonly fileName: string;
  readonly fileType: "xlsx" | "csv";
  readonly sizeBytes: number;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
  readonly detectedTables: readonly string[];
}

export interface ImportColumnMapping {
  readonly sourceHeader: string;
  readonly targetField: string | null;
  readonly confidence: "high" | "low";
  readonly sampleValues: readonly string[];
}

export interface ImportTableInspection {
  readonly sourceTableId: string;
  readonly fileName: string;
  readonly sourceTableName: string;
  readonly targetTable: ImportTableName | null;
  readonly headerRow: number;
  readonly rowCount: number;
  readonly columns: readonly ImportColumnMapping[];
}

export interface ImportMappingPlanEntry {
  readonly sourceTableId: string;
  readonly targetTable: ImportTableName | null;
  readonly columns: Readonly<Record<string, string | null>>;
}

export interface ImportIssue {
  readonly issueId: string;
  readonly severity: ImportIssueSeverity;
  readonly code: string;
  readonly table?: ImportTableName;
  readonly sourceTableId?: string;
  readonly rowNumber?: number;
  readonly field?: string;
  readonly projectCode?: string;
  readonly description: string;
  readonly resolution: string;
  readonly quarantined: boolean;
}

export interface ImportInspectionResult {
  readonly attemptId: ImportAttemptId;
  readonly occurredAt: string;
  readonly ingestedAt: string;
  readonly recordedAt: string;
  readonly files: readonly ImportFileDescriptor[];
  readonly tables: readonly ImportTableInspection[];
  readonly issues: readonly ImportIssue[];
  readonly readiness: ImportReadiness;
}

export interface ImportControlTotal {
  readonly label: string;
  readonly sourceValue: number;
  readonly loadValue: number;
  readonly difference: number;
  readonly unit: "count" | "currency" | "hours";
  readonly status: "reconciled" | "difference";
}

export interface ImportPreview {
  readonly projectCount: number;
  readonly transactionCount: number;
  readonly totalEstimatedCost: number | null;
  readonly totalActualCost: number;
  readonly totalContractValue: number;
  readonly laborHours: number | null;
  readonly unmappedRecords: number;
  readonly warningCount: number;
  readonly rejectedRecordCount: number;
  readonly controlTotals: readonly ImportControlTotal[];
}

export interface ImportAnalysisAvailability {
  readonly analysis: string;
  readonly available: boolean;
  readonly explanation: string;
}

export interface SafeNormalizedImportDataset {
  readonly tables: Readonly<Record<string, readonly Readonly<Record<string, string | number | boolean | null>>[]>>;
}

export interface ValidatedImportPackage {
  readonly attemptId: ImportAttemptId;
  readonly versionId: ImportVersionId;
  readonly occurredAt: string;
  readonly ingestedAt: string;
  readonly recordedAt: string;
  readonly files: readonly ImportFileDescriptor[];
  readonly readiness: ImportReadiness;
  readonly issues: readonly ImportIssue[];
  readonly preview: ImportPreview;
  readonly analyses: readonly ImportAnalysisAvailability[];
  readonly snapshot: TrailSolutionsSnapshot;
  readonly projectDetails: Readonly<Record<string, ProjectDetail>>;
  readonly normalizedDataset: SafeNormalizedImportDataset;
}

export interface ImportVersionRecord {
  readonly attemptId: ImportAttemptId;
  readonly versionId: ImportVersionId;
  readonly previousVersionId?: ImportVersionId;
  readonly mode: ImportWorkspaceMode;
  readonly occurredAt: string;
  readonly ingestedAt: string;
  readonly recordedAt: string;
  readonly importedBy: string;
  readonly sourceFiles: readonly ImportFileDescriptor[];
  readonly mappingTemplateName?: string;
  readonly mappingChangeCount: number;
  readonly recordsAccepted: number;
  readonly recordsRejected: number;
  readonly warningCount: number;
  readonly reconciliationDifferenceCount: number;
}

export interface TrailSolutionsTestWorkspace {
  readonly workspaceId: TestWorkspaceId;
  readonly organizationId: string;
  readonly name: string;
  readonly description: string;
  readonly environment: "uploaded-test" | "validated-production-derived";
  readonly firstImportedAt: string;
  readonly lastImportedAt: string;
  readonly importedBy: string;
  readonly mappingTemplateName?: string;
  readonly projectCount: number;
  readonly dataQualityStatus: ImportReadiness;
  readonly archived: boolean;
  readonly activeVersionId: ImportVersionId;
  readonly versions: readonly ImportVersionRecord[];
  readonly sourceFiles: readonly ImportFileDescriptor[];
  readonly validatedPackage: ValidatedImportPackage;
}

export interface ImportMappingTemplate {
  readonly mappingTemplateId: MappingTemplateId;
  readonly name: string;
  readonly sourceLabel: string;
  readonly savedAt: string;
  readonly mappings: readonly ImportMappingPlanEntry[];
}
