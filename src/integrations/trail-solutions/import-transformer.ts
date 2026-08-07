import {
  asImportAttemptId,
  asImportVersionId,
  asProjectId,
} from "@/core/primitives/identity";
import type {
  CostCategory,
  DataExceptionType,
  ProjectBusinessLine,
  ProjectStage,
} from "@/core/trail-solutions/model";
import {
  importTableSpec,
  type ImportAnalysisAvailability,
  type ImportControlTotal,
  type ImportFileDescriptor,
  type ImportIssue,
  type ImportPreview,
  type ImportTableName,
  type SafeNormalizedImportDataset,
  type ValidatedImportPackage,
} from "@/core/trail-solutions/import-lab";
import { importReadiness, type MappedImportTables } from "@/integrations/trail-solutions/import-parser";
import {
  WorkbookDerivedTrailSolutionsDataSource,
  trailSolutionsDemoContext,
  type RawWorkbookDerivedInput,
} from "@/integrations/trail-solutions/workbook-derived-adapter";

type Scalar = string | number | boolean | null;
type Row = Readonly<Record<string, Scalar>>;

const COST_CATEGORIES: readonly CostCategory[] = [
  "Direct labor",
  "Payroll burden",
  "Travel and lodging",
  "Materials",
  "Equipment",
  "Subcontractors",
  "Project management",
  "Allocated indirect costs",
  "Contingency",
  "Other project costs",
];

function issue(input: Omit<ImportIssue, "issueId">): ImportIssue {
  return Object.freeze({ issueId: crypto.randomUUID(), ...input });
}

function rows(mapped: MappedImportTables, table: ImportTableName): readonly Row[] {
  return mapped.tables[table] ?? [];
}

function text(row: Row | undefined, field: string, fallback = ""): string {
  const value = row?.[field];
  return value === undefined || value === null ? fallback : String(value).trim();
}

function amount(row: Row | undefined, field: string): number | null {
  const value = row?.[field];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const source = String(value).trim();
  const negative = /^\(.*\)$/.test(source);
  const parsed = Number(source.replace(/[,$%()\s]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

function nonnegative(row: Row | undefined, field: string): number {
  return Math.max(amount(row, field) ?? 0, 0);
}

function date(row: Row | undefined, field: string, fallback: string): string {
  const source = text(row, field);
  if (!source) return fallback;
  const parsed = Date.parse(source);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString().slice(0, 10);
}

function yes(value: Scalar | undefined): boolean {
  if (typeof value === "boolean") return value;
  return /^(yes|true|1|approved|restricted)$/i.test(String(value ?? "").trim());
}

function mapBusinessLine(value: string): ProjectBusinessLine {
  if (/construct/i.test(value)) return "Construction";
  if (/sign|wayfind/i.test(value)) return "Signage";
  if (/educat|train|academy/i.test(value)) return "Education & Training";
  if (/grant|agreement|federal/i.test(value)) return "Grants & Agreements";
  if (/plan|design/i.test(value)) return "Planning & Design";
  return "Unclassified";
}

function mapStage(value: string): ProjectStage {
  if (/complete|closed/i.test(value)) return "Completed";
  if (/closeout/i.test(value)) return "Closeout";
  if (/hold|pause/i.test(value)) return "On hold";
  if (/scope|proposal|planning/i.test(value)) return "Scoping";
  if (/active|open|progress|construction/i.test(value)) return "Active";
  return "Unknown";
}

function mapCostCategory(value: string): CostCategory {
  if (/payroll|burden|benefit|employer tax/i.test(value)) return "Payroll burden";
  if (/labor|wage|crew|staff/i.test(value)) return "Direct labor";
  if (/travel|lodg|mileage|meal|per diem/i.test(value)) return "Travel and lodging";
  if (/material|supply|freight|shipping/i.test(value)) return "Materials";
  if (/equipment|rental|vehicle|fuel/i.test(value)) return "Equipment";
  if (/subcontract|consultant|contractor/i.test(value)) return "Subcontractors";
  if (/project management|\bpm\b|management/i.test(value)) return "Project management";
  if (/indirect|overhead|allocation/i.test(value)) return "Allocated indirect costs";
  if (/contingen/i.test(value)) return "Contingency";
  return "Other project costs";
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function latestDate(values: readonly string[], fallback: string): string {
  return values.filter((value) => !Number.isNaN(Date.parse(value))).sort().at(-1) ?? fallback;
}

function addDays(isoDate: string, days: number): string {
  const value = new Date(isoDate);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function projectRows(tableRows: readonly Row[], sourceProjectCode: string): Row[] {
  return tableRows.filter((row) => text(row, "Project ID") === sourceProjectCode);
}

function categoryTotals(tableRows: readonly Row[], valueField: string): Map<CostCategory, number> {
  const totals = new Map<CostCategory, number>();
  for (const row of tableRows) {
    const category = mapCostCategory(text(row, "Cost Type"));
    totals.set(category, (totals.get(category) ?? 0) + nonnegative(row, valueField));
  }
  return totals;
}

function allocateRemaining(
  estimated: ReadonlyMap<CostCategory, number>,
  actual: ReadonlyMap<CostCategory, number>,
  estimatedCostToComplete: number | null,
): Map<CostCategory, number | null> {
  const result = new Map<CostCategory, number | null>();
  if (estimatedCostToComplete === null) {
    COST_CATEGORIES.forEach((category) => result.set(category, null));
    return result;
  }
  const weights = COST_CATEGORIES.map((category) => Math.max((estimated.get(category) ?? 0) - (actual.get(category) ?? 0), 0));
  const totalWeight = sum(weights);
  let allocated = 0;
  COST_CATEGORIES.forEach((category, index) => {
    const isLast = index === COST_CATEGORIES.length - 1;
    const value = isLast
      ? estimatedCostToComplete - allocated
      : totalWeight > 0
        ? estimatedCostToComplete * (weights[index] / totalWeight)
        : category === "Other project costs"
          ? estimatedCostToComplete
          : 0;
    const safe = Math.max(value, 0);
    result.set(category, safe);
    allocated += safe;
  });
  return result;
}

function rawExceptionType(code: string): DataExceptionType {
  if (/PROJECT|ASSIGNMENT/.test(code)) return "missing-project";
  if (/COST_CODE/.test(code)) return "missing-cost-code";
  if (/HOURS/.test(code)) return "missing-hours";
  if (/OPERATIONAL/.test(code)) return "missing-operational-quantity";
  if (/ESTIMATE_TO_COMPLETE/.test(code)) return "missing-estimate-to-complete";
  if (/ESTIMATE/.test(code)) return "missing-estimate";
  if (/BILLING|RECONCILIATION/.test(code)) return "billing-reconciliation";
  if (/FUNDING/.test(code)) return "funding-classification";
  if (/DUPLICATE/.test(code)) return "duplicate-record";
  return "conflicting-mapping";
}

function validateMappedValues(mapped: MappedImportTables, issues: ImportIssue[]): void {
  for (const tableSpec of [
    "Project Master", "Project Crosswalk", "Estimate Lines", "Labor Actuals", "Nonlabor Actuals",
    "Revenue & Billing", "Change Orders", "Operational Drivers", "Grant Funding", "Labor Rate Library",
    "Cost Code Map", "Project Summary", "Benchmark Library",
  ] as const) {
    const sourceRows = rows(mapped, tableSpec);
    if (!sourceRows.length) continue;
    const spec = importTableSpec(tableSpec);
    sourceRows.forEach((row, rowIndex) => {
      for (const field of spec.fields) {
        const value = row[field.field];
        if (field.required && (value === undefined || value === null || String(value).trim() === "")) {
          issues.push(issue({
            severity: tableSpec === "Project Master" ? "error" : "warning",
            code: "BLANK_REQUIRED_VALUE",
            table: tableSpec,
            rowNumber: rowIndex + 1,
            field: field.field,
            projectCode: text(row, "Project ID") || undefined,
            description: `${tableSpec} row ${rowIndex + 1} has a blank required ${field.field}.`,
            resolution: tableSpec === "Project Master" ? "Supply the required project identity before importing." : "Correct the row or leave it quarantined.",
            quarantined: tableSpec !== "Project Master",
          }));
        }
        if (value !== undefined && value !== null && String(value).trim() && field.kind === "number" && amount(row, field.field) === null) {
          issues.push(issue({
            severity: "warning",
            code: "NON_NUMERIC_FINANCIAL_VALUE",
            table: tableSpec,
            rowNumber: rowIndex + 1,
            field: field.field,
            projectCode: text(row, "Project ID") || undefined,
            description: `${tableSpec} row ${rowIndex + 1} has a non-numeric value in ${field.field}.`,
            resolution: "Correct the numeric value; the affected amount is excluded from loaded totals.",
            quarantined: false,
          }));
        }
        if (value !== undefined && value !== null && String(value).trim() && field.kind === "date" && Number.isNaN(Date.parse(String(value)))) {
          issues.push(issue({
            severity: "warning",
            code: "INVALID_DATE",
            table: tableSpec,
            rowNumber: rowIndex + 1,
            field: field.field,
            projectCode: text(row, "Project ID") || undefined,
            description: `${tableSpec} row ${rowIndex + 1} has an invalid date in ${field.field}.`,
            resolution: "Correct the date; the import uses the workspace validation date as a fallback.",
            quarantined: false,
          }));
        }
      }
    });
  }
}

function validateProjectRelationships(mapped: MappedImportTables, issues: ImportIssue[]): Set<string> {
  const projectMasterRows = rows(mapped, "Project Master");
  const known = new Set<string>();
  projectMasterRows.forEach((row, index) => {
    const projectCode = text(row, "Project ID");
    if (!projectCode) return;
    if (known.has(projectCode)) {
      issues.push(issue({
        severity: "error",
        code: "DUPLICATE_PROJECT_ID",
        table: "Project Master",
        rowNumber: index + 1,
        projectCode,
        description: `Project ID ${projectCode} appears more than once in Project Master.`,
        resolution: "Resolve the duplicate before importing.",
        quarantined: false,
      }));
    }
    known.add(projectCode);
  });
  const childTables: ImportTableName[] = ["Project Crosswalk", "Estimate Lines", "Labor Actuals", "Nonlabor Actuals", "Revenue & Billing", "Change Orders", "Operational Drivers", "Grant Funding", "Project Summary"];
  for (const table of childTables) {
    rows(mapped, table).forEach((row, index) => {
      const projectCode = text(row, "Project ID");
      if (!projectCode || !known.has(projectCode)) {
        issues.push(issue({
          severity: "warning",
          code: projectCode ? "UNRECOGNIZED_PROJECT_ID" : "TRANSACTION_MISSING_PROJECT_ID",
          table,
          rowNumber: index + 1,
          projectCode: projectCode || undefined,
          description: projectCode ? `${table} row ${index + 1} references unknown Project ID ${projectCode}.` : `${table} row ${index + 1} has no project assignment.`,
          resolution: "Map the source project identifier or leave this row quarantined.",
          quarantined: true,
        }));
      }
    });
  }
  return known;
}

function additionalControlIssues(mapped: MappedImportTables, knownProjects: ReadonlySet<string>, issues: ImportIssue[]): void {
  const costCodeRows = rows(mapped, "Cost Code Map");
  const mappedCostCodes = new Set(costCodeRows.filter((row) => /mapped|approved/i.test(text(row, "Mapping Status", "mapped"))).map((row) => text(row, "Source Code")).filter(Boolean));
  for (const table of ["Labor Actuals", "Nonlabor Actuals"] as const) {
    rows(mapped, table).forEach((row, index) => {
      if (!knownProjects.has(text(row, "Project ID"))) return;
      const costCode = text(row, "Cost Code");
      if (costCodeRows.length && costCode && !mappedCostCodes.has(costCode)) {
        issues.push(issue({
          severity: "warning", code: "UNMAPPED_COST_CODE", table, rowNumber: index + 1,
          projectCode: text(row, "Project ID"), field: "Cost Code",
          description: `${table} row ${index + 1} uses unmapped cost code ${costCode}.`,
          resolution: "Map the cost code before relying on category-level analysis.", quarantined: false,
        }));
      }
    });
  }
  rows(mapped, "Labor Actuals").forEach((row, index) => {
    if (nonnegative(row, "Fully Burdened Labor Cost ($)") > 0 && amount(row, "Hours") === null) {
      issues.push(issue({
        severity: "warning", code: "LABOR_DOLLARS_WITHOUT_HOURS", table: "Labor Actuals", rowNumber: index + 1,
        projectCode: text(row, "Project ID"), description: `Labor Actuals row ${index + 1} has labor dollars without hours.`,
        resolution: "Supply hours to enable productivity and unit-cost benchmarks.", quarantined: false,
      }));
    }
  });
  rows(mapped, "Nonlabor Actuals").forEach((row, index) => {
    if (nonnegative(row, "Amount ($)") > 0 && amount(row, "Quantity") === null) {
      issues.push(issue({
        severity: "warning", code: "COST_WITHOUT_OPERATIONAL_QUANTITY", table: "Nonlabor Actuals", rowNumber: index + 1,
        projectCode: text(row, "Project ID"), description: `Nonlabor Actuals row ${index + 1} has dollars without an operational quantity.`,
        resolution: "Supply quantity and unit to enable unit-cost analysis.", quarantined: false,
      }));
    }
  });
  rows(mapped, "Revenue & Billing").forEach((row, index) => {
    const supplied = amount(row, "Outstanding AR ($)");
    const calculated = nonnegative(row, "Invoice Amount ($)") - nonnegative(row, "Cash Collected ($)");
    if (supplied !== null && Math.abs(supplied - calculated) > 0.01) {
      issues.push(issue({
        severity: "warning", code: "BILLING_RECONCILIATION_DIFFERENCE", table: "Revenue & Billing", rowNumber: index + 1,
        projectCode: text(row, "Project ID"), description: `Billing row ${index + 1} does not reconcile supplied AR to invoice less cash.`,
        resolution: "Reconcile the billing record before relying on collection status.", quarantined: false,
      }));
    }
  });
}

function projectManagerAliases(projectRows: readonly Row[]): Map<string, string> {
  const aliases = new Map<string, string>();
  for (const row of projectRows) {
    const source = text(row, "Project Manager");
    if (source && !aliases.has(source)) aliases.set(source, `Project Manager ${aliases.size + 1}`);
  }
  return aliases;
}

function buildRawInput(mapped: MappedImportTables, issues: ImportIssue[], serverTime: string): RawWorkbookDerivedInput {
  const serverDate = serverTime.slice(0, 10);
  const projectMasterRows = rows(mapped, "Project Master");
  const managerAliases = projectManagerAliases(projectMasterRows);
  const sourceToCanonical = new Map<string, string>();
  projectMasterRows.forEach((row) => {
    const code = text(row, "Project ID");
    if (code && !sourceToCanonical.has(code)) sourceToCanonical.set(code, crypto.randomUUID());
  });

  const rawProjects: RawWorkbookDerivedInput["projects"] = [];
  for (const master of projectMasterRows) {
    const projectCode = text(master, "Project ID");
    const projectName = text(master, "Project Name");
    if (!projectCode || !projectName || rawProjects.some((project) => project.projectCode === projectCode)) continue;
    const estimateRows = projectRows(rows(mapped, "Estimate Lines"), projectCode);
    const laborRows = projectRows(rows(mapped, "Labor Actuals"), projectCode);
    const nonlaborRows = projectRows(rows(mapped, "Nonlabor Actuals"), projectCode);
    const billingRows = projectRows(rows(mapped, "Revenue & Billing"), projectCode);
    const changeRows = projectRows(rows(mapped, "Change Orders"), projectCode);
    const driverRows = projectRows(rows(mapped, "Operational Drivers"), projectCode);
    const grantRows = projectRows(rows(mapped, "Grant Funding"), projectCode);
    const summaryRow = projectRows(rows(mapped, "Project Summary"), projectCode).at(-1);
    const crosswalkRows = projectRows(rows(mapped, "Project Crosswalk"), projectCode);

    if (!estimateRows.length) {
      issues.push(issue({ severity: "warning", code: "PROJECT_MISSING_ESTIMATE", table: "Estimate Lines", projectCode, description: `${projectCode} has no current estimate.`, resolution: "Load an approved estimate to enable estimate-to-actual analysis.", quarantined: false }));
    }
    const explicitEtc = amount(summaryRow, "Estimate to Complete ($)");
    if (explicitEtc === null) {
      issues.push(issue({ severity: "warning", code: "PROJECT_MISSING_ESTIMATE_TO_COMPLETE", table: "Project Summary", projectCode, description: `${projectCode} has no explicit estimate-to-complete update.`, resolution: "Supply ETC before relying on forecast final cost or margin.", quarantined: false }));
    }
    if (!billingRows.length) {
      issues.push(issue({ severity: "information", code: "BILLING_DATA_UNAVAILABLE", table: "Revenue & Billing", projectCode, description: `${projectCode} has no billing data.`, resolution: "Cost analysis remains available; billing metrics are unavailable.", quarantined: false }));
    }

    const estimated = categoryTotals(estimateRows, "Estimated Cost ($)");
    const actual = categoryTotals(nonlaborRows, "Amount ($)");
    const directWages = sum(laborRows.map((row) => nonnegative(row, "Direct Wages ($)")));
    const fullyBurdened = sum(laborRows.map((row) => nonnegative(row, "Fully Burdened Labor Cost ($)")));
    const burdenComponents = sum(laborRows.map((row) => nonnegative(row, "Employer Taxes ($)") + nonnegative(row, "Benefits ($)") + nonnegative(row, "Other Burden ($)")));
    const laborDirect = directWages > 0 ? directWages : Math.max(fullyBurdened - burdenComponents, 0);
    const laborBurden = burdenComponents > 0 ? burdenComponents : Math.max(fullyBurdened - laborDirect, 0);
    actual.set("Direct labor", (actual.get("Direct labor") ?? 0) + laborDirect);
    actual.set("Payroll burden", (actual.get("Payroll burden") ?? 0) + laborBurden);
    const originalEstimate = sum([...estimated.values()]);
    const approvedChanges = changeRows.filter((row) => /approved/i.test(text(row, "Status")) || yes(row["Customer Approved?"]));
    const approvedChangeRevenue = sum(approvedChanges.map((row) => nonnegative(row, "Additional Revenue ($)")));
    const approvedChangeCost = sum(approvedChanges.map((row) => nonnegative(row, "Additional Estimated Cost ($)")));
    if (approvedChangeCost > 0) {
      estimated.set("Other project costs", (estimated.get("Other project costs") ?? 0) + approvedChangeCost);
    }
    const remaining = allocateRemaining(estimated, actual, explicitEtc === null ? null : Math.max(explicitEtc, 0));

    const roleMap = new Map<string, { planned: number; actual: number }>();
    estimateRows.filter((row) => /hour/i.test(text(row, "Unit"))).forEach((row) => {
      const role = text(row, "Resource Role / Item", "Unspecified role");
      const entry = roleMap.get(role) ?? { planned: 0, actual: 0 };
      entry.planned += nonnegative(row, "Quantity");
      roleMap.set(role, entry);
    });
    laborRows.forEach((row) => {
      const role = text(row, "Role", "Unspecified role");
      const entry = roleMap.get(role) ?? { planned: 0, actual: 0 };
      entry.actual += nonnegative(row, "Hours");
      roleMap.set(role, entry);
    });
    const staffingMix: [string, number, number, number][] = roleMap.size
      ? [...roleMap].map(([role, values]) => [role, values.planned, values.actual, Math.max(values.planned - values.actual, 0)])
      : [["Hours unavailable", 0, 0, 0]];

    const originalContract = nonnegative(master, "Original Contract Value ($)") || Math.max(...billingRows.map((row) => nonnegative(row, "Contract Value ($)")), 0);
    const driver = driverRows.at(-1);
    const latestSourceDate = latestDate([
      ...laborRows.map((row) => date(row, "Work Date", serverDate)),
      ...nonlaborRows.map((row) => date(row, "Accounting Date", serverDate)),
      ...billingRows.map((row) => date(row, "Document Date", serverDate)),
      date(driver, "Snapshot / Final Date", serverDate),
    ], serverDate);
    const projectIssues = issues.filter((candidate) => candidate.projectCode === projectCode && candidate.severity !== "information");
    const dataQuality = projectIssues.some((candidate) => /MISSING_ESTIMATE_TO_COMPLETE|UNRECOGNIZED_PROJECT|MISSING_PROJECT/.test(candidate.code))
      ? "C" as const
      : projectIssues.length
        ? "B" as const
        : "A" as const;
    const billing = {
      recognizedRevenue: sum(billingRows.map((row) => nonnegative(row, "Revenue Recognized ($)"))),
      invoicedAmount: sum(billingRows.map((row) => nonnegative(row, "Invoice Amount ($)"))),
      cashCollected: sum(billingRows.map((row) => nonnegative(row, "Cash Collected ($)"))),
      lastInvoiceDate: latestDate(billingRows.filter((row) => nonnegative(row, "Invoice Amount ($)") > 0).map((row) => date(row, "Document Date", serverDate)), serverDate),
      invoiceDueDate: latestDate(billingRows.map((row) => date(row, "Due Date", serverDate)), serverDate),
    };
    const pending = changeRows.find((row) => !/approved|rejected/i.test(text(row, "Status")) && !yes(row["Customer Approved?"]));
    const grant = grantRows.at(-1);
    const crosswalks: [string, string, string][] = crosswalkRows
      .map<[string, string, string]>((row) => [text(row, "Source System", "Imported file"), text(row, "Source Entity Type", "Project"), text(row, "Source ID / Code")])
      .filter((entry) => Boolean(entry[2]));
    for (const [system, kind, value] of [["QuickBooks Online", "Customer:Job", text(master, "Historical QBO Job")], ["ADP", "Job Code", text(master, "ADP Job Code")], ["Monday.com", "Item ID", text(master, "Monday.com Item ID")]] as const) {
      if (value) crosswalks.push([system, kind, value]);
    }
    if (!crosswalks.length) crosswalks.push(["Uploaded file", "Project ID", projectCode]);

    const decisions: RawWorkbookDerivedInput["projects"][number]["decisions"] = [];
    const forecastHours = sum(staffingMix.map((entry) => entry[1]));
    const actualHours = sum(staffingMix.map((entry) => entry[2]));
    if (forecastHours > 0 && actualHours > forecastHours * 1.1) decisions.push({ issue: "Labor hours exceed the approved estimate", financialEffect: fullyBurdened, financialEffectLabel: `${Math.round(actualHours - forecastHours).toLocaleString()} hours above plan`, recommendedAction: "Reforecast remaining labor and review the role mix.", owner: "Imported project owner", dueDate: addDays(serverDate, 7), supportingSection: "labor" });
    if (pending) decisions.push({ issue: "Scope change has not been approved", financialEffect: nonnegative(pending, "Additional Estimated Cost ($)"), financialEffectLabel: `${nonnegative(pending, "Additional Estimated Cost ($)").toLocaleString()} of estimated cost lacks approved revenue`, recommendedAction: "Confirm scope and pursue the change order before additional work.", owner: text(pending, "Approval Owner", "Project leadership"), dueDate: addDays(serverDate, 7), supportingSection: "what-changed" });
    if (billing.recognizedRevenue > billing.invoicedAmount) decisions.push({ issue: "Billing is behind documented progress", financialEffect: billing.recognizedRevenue - billing.invoicedAmount, financialEffectLabel: `${(billing.recognizedRevenue - billing.invoicedAmount).toLocaleString()} of earned work remains unbilled`, recommendedAction: "Confirm milestone evidence and release the next invoice package.", owner: "Finance + Project Manager", dueDate: addDays(serverDate, 7), supportingSection: "billing" });
    if (projectIssues.length) decisions.push({ issue: "Project data requires resolution", financialEffectLabel: `${projectIssues.length} validation issue${projectIssues.length === 1 ? "" : "s"} affect reporting confidence`, recommendedAction: "Resolve the Import Lab exceptions before relying on the forecast.", owner: "Finance data steward", dueDate: addDays(serverDate, 5), supportingSection: "data-health" });

    rawProjects.push({
      projectId: sourceToCanonical.get(projectCode)!, projectCode, projectName,
      clientName: text(master, "Customer / Funder", "Client unavailable"),
      businessLine: mapBusinessLine(text(master, "Business Line")),
      projectManager: managerAliases.get(text(master, "Project Manager")) ?? "Unassigned",
      region: text(master, "Region", "Unspecified"), state: text(master, "State", "—"),
      contractType: text(master, "Contract Type", "Unspecified"), fundingType: text(master, "Funding Type", "Unspecified"),
      projectStage: mapStage(text(master, "Status")), startDate: date(master, "Start Date", serverDate),
      expectedCompletionDate: date(master, "Completion Date", serverDate), originalContractValue: originalContract,
      approvedChangeOrders: approvedChangeRevenue, originalEstimatedCost: originalEstimate,
      revisedBudgetCost: originalEstimate + approvedChangeCost, estimatedCostToComplete: explicitEtc === null ? null : Math.max(explicitEtc, 0),
      dataQuality, lastDataRefresh: latestSourceDate,
      estimatedLaborHours: sum(staffingMix.map((entry) => entry[1])), actualLaborHours: sum(staffingMix.map((entry) => entry[2])),
      forecastRemainingLaborHours: staffingMix.some((entry) => entry[1] > 0) ? sum(staffingMix.map((entry) => entry[3])) : null,
      trailMiles: nonnegative(master, "Trail Miles") || nonnegative(driver, "Trail Miles"),
      costBreakdown: COST_CATEGORIES.map((category) => [category, estimated.get(category) ?? 0, actual.get(category) ?? 0, remaining.get(category) ?? null]),
      staffingMix, billing,
      operationalDriver: {
        terrainClass: text(driver, "Terrain Class", "Unavailable"), siteAccessComplexity: text(driver, "Site Access Complexity", "Unavailable"),
        siteVisits: nonnegative(driver, "Site Visits"), stakeholderMeetings: nonnegative(driver, "Stakeholder Meetings"), designRevisions: nonnegative(driver, "Design Revisions"),
        permittingComplexity: text(driver, "Permitting Complexity", "Unavailable"), crewSize: nonnegative(driver, "Crew Size"), crewDays: nonnegative(driver, "Crew Days"),
        equipmentDays: nonnegative(driver, "Equipment Days"), signsDesigned: nonnegative(driver, "Signs Designed"), signsFabricated: nonnegative(driver, "Signs Fabricated"), signsInstalled: nonnegative(driver, "Signs Installed"),
        travelMiles: nonnegative(driver, "Travel Miles"), lodgingNights: nonnegative(driver, "Lodging Nights"), subcontractorCount: nonnegative(driver, "Subcontractor Count"),
        weatherDelayDays: nonnegative(driver, "Weather Delay Days"), customerDelayDays: nonnegative(driver, "Customer Delay Days"), projectDurationDays: nonnegative(driver, "Project Duration Days"),
        scopeChangeWithoutApproval: Boolean(pending),
      },
      crosswalks,
      pendingChangeOrder: pending ? {
        changeNumber: text(pending, "Change No.", "PENDING"), identifiedDate: date(pending, "Identified Date", serverDate),
        description: text(pending, "Description", "Imported pending scope change"), cause: text(pending, "Cause", "Unspecified"),
        additionalRevenue: nonnegative(pending, "Additional Revenue ($)"), additionalEstimatedCost: nonnegative(pending, "Additional Estimated Cost ($)"),
        scheduleDays: nonnegative(pending, "Schedule Days"), approvalOwner: text(pending, "Approval Owner", "Project leadership"),
      } : undefined,
      grant: grant ? {
        externalAwardId: text(grant, "Grant / Award ID", "Unavailable"), funder: text(grant, "Funder", "Unavailable"), grantType: text(grant, "Grant Type", "Unclassified"),
        awardAmount: nonnegative(grant, "Award Amount ($)"), startDate: date(grant, "Start Date", serverDate), endDate: date(grant, "End Date", serverDate),
        reimbursementBasis: text(grant, "Reimbursement Basis", "Unavailable"), matchType: text(grant, "Match Type", "Unavailable"), matchRequirement: nonnegative(grant, "Match Requirement ($)"),
        eligibleCostToDate: nonnegative(grant, "Eligible Cost to Date ($)"), reimbursementsRequested: nonnegative(grant, "Reimbursements Requested ($)"), reimbursementsReceived: nonnegative(grant, "Reimbursements Received ($)"),
        matchDocumented: nonnegative(grant, "Match Documented ($)"), indirectRate: nonnegative(grant, "Indirect Rate"), reportingFrequency: text(grant, "Reporting Frequency", "Unavailable"), nextReportDue: date(grant, "Next Report Due", serverDate),
      } : undefined,
      exceptions: projectIssues.map((candidate, index) => ({ sourceSystem: "Import Lab", sourceRecordId: `${projectCode}-ISSUE-${index + 1}`, recordDate: serverDate, rawProjectCode: projectCode, exceptionType: rawExceptionType(candidate.code), description: candidate.description, severity: candidate.severity === "error" ? "high" : "moderate", owner: "Finance data steward", openedAt: serverTime })),
      decisions,
    });
  }

  const benchmarkRows = rows(mapped, "Benchmark Library");
  const benchmarks: RawWorkbookDerivedInput["benchmarks"] = benchmarkRows.map((row) => [
    mapBusinessLine(text(row, "Business Line")), text(row, "Metric / Driver", "Imported benchmark"), text(row, "Unit", "value"),
    Math.round(nonnegative(row, "Sample Count")), nonnegative(row, "Low / P25"), nonnegative(row, "Median"), nonnegative(row, "High / P75"),
    /high/i.test(text(row, "Confidence")) ? "high" : /moderate|medium/i.test(text(row, "Confidence")) ? "moderate" : "low",
    "All imported regions", "Imported cohort", date(row, "Effective Date", serverDate), serverDate,
  ]);
  const globalIssues = issues.filter((candidate) => !candidate.projectCode && candidate.severity !== "information");
  return {
    metadata: {
      sourceName: "Data Import Lab sanitized workspace",
      workbookTemplate: "Uploaded workbook or CSV tables",
      transformVersion: 1,
      sourceAsOfDate: serverDate,
      organizationId: trailSolutionsDemoContext.organizationId,
      chapterScope: "NATIONAL",
      dataEnvironment: "uploaded-test",
    },
    projects: rawProjects,
    unmappedSourceRecords: globalIssues.map((candidate, index) => ({ sourceSystem: "Import Lab", sourceRecordId: `GLOBAL-ISSUE-${index + 1}`, recordDate: serverDate, exceptionType: rawExceptionType(candidate.code), description: candidate.description, severity: candidate.severity === "error" ? "high" : "moderate", owner: "Finance data steward", openedAt: serverTime })),
    benchmarks,
    refreshStatuses: [["Uploaded files", "mock", "current", serverTime, `${rawProjects.length} imported test projects`, issues.filter((candidate) => candidate.severity !== "information").length]],
  };
}

function safeDataset(raw: RawWorkbookDerivedInput, issues: readonly ImportIssue[]): SafeNormalizedImportDataset {
  return Object.freeze({
    tables: Object.freeze({
      "Project Summary": raw.projects.map((project) => Object.freeze({
        projectId: project.projectId, projectCode: project.projectCode, projectName: project.projectName,
        businessLine: project.businessLine, clientName: project.clientName, projectManager: project.projectManager,
        originalContractValue: project.originalContractValue, approvedChangeOrders: project.approvedChangeOrders,
        originalEstimatedCost: project.originalEstimatedCost, revisedBudgetCost: project.revisedBudgetCost,
        estimatedCostToComplete: project.estimatedCostToComplete, estimatedLaborHours: project.estimatedLaborHours,
        actualLaborHours: project.actualLaborHours, dataQuality: project.dataQuality, lastDataRefresh: project.lastDataRefresh,
      })),
      "Cost Summary": raw.projects.flatMap((project) => project.costBreakdown.map(([category, estimated, actual, remaining]) => Object.freeze({ projectCode: project.projectCode, category, estimated, actual, remaining }))),
      "Labor Summary": raw.projects.flatMap((project) => project.staffingMix.map(([role, plannedHours, actualHours, forecastRemainingHours]) => Object.freeze({ projectCode: project.projectCode, role, plannedHours, actualHours, forecastRemainingHours }))),
      Exceptions: issues.map((candidate) => Object.freeze({ code: candidate.code, severity: candidate.severity, table: candidate.table ?? null, projectCode: candidate.projectCode ?? null, description: candidate.description, quarantined: candidate.quarantined })),
    }),
  });
}

function controlTotals(mapped: MappedImportTables, raw: RawWorkbookDerivedInput, issues: readonly ImportIssue[]): ImportControlTotal[] {
  const sourceProjects = rows(mapped, "Project Master").filter((row) => text(row, "Project ID") && text(row, "Project Name")).length;
  const sourceEstimate = sum(rows(mapped, "Estimate Lines").map((row) => nonnegative(row, "Estimated Cost ($)")));
  const sourceLabor = sum(rows(mapped, "Labor Actuals").map((row) => nonnegative(row, "Fully Burdened Labor Cost ($)")));
  const sourceNonlabor = sum(rows(mapped, "Nonlabor Actuals").map((row) => nonnegative(row, "Amount ($)")));
  const sourceHours = sum(rows(mapped, "Labor Actuals").map((row) => nonnegative(row, "Hours")));
  const loadedEstimate = sum(raw.projects.map((project) => project.originalEstimatedCost));
  const loadedActual = sum(raw.projects.flatMap((project) => project.costBreakdown.map((line) => line[2])));
  const loadedHours = sum(raw.projects.map((project) => project.actualLaborHours));
  const values: Array<[string, number, number, ImportControlTotal["unit"]]> = [
    ["Projects", sourceProjects, raw.projects.length, "count"],
    ["Estimated cost", sourceEstimate, loadedEstimate, "currency"],
    ["Actual cost", sourceLabor + sourceNonlabor, loadedActual, "currency"],
    ["Labor hours", sourceHours, loadedHours, "hours"],
    ["Quarantined records", issues.filter((candidate) => candidate.quarantined).length, issues.filter((candidate) => candidate.quarantined).length, "count"],
  ];
  return values.map(([label, sourceValue, loadValue, unit]) => {
    const difference = loadValue - sourceValue;
    return Object.freeze({ label, sourceValue, loadValue, difference, unit, status: Math.abs(difference) <= 0.01 ? "reconciled" as const : "difference" as const });
  });
}

function availability(mapped: MappedImportTables, issues: readonly ImportIssue[]): ImportAnalysisAvailability[] {
  const has = (table: ImportTableName) => rows(mapped, table).length > 0;
  const laborHoursMissing = issues.some((candidate) => candidate.code === "LABOR_DOLLARS_WITHOUT_HOURS");
  const analyses: ImportAnalysisAvailability[] = [
    { analysis: "Portfolio and project identity", available: has("Project Master"), explanation: has("Project Master") ? "Project Master is loaded." : "Project Master is required." },
    { analysis: "Estimate-to-actual comparison", available: has("Estimate Lines"), explanation: has("Estimate Lines") ? "Estimate lines are loaded." : "Estimate data was not supplied." },
    { analysis: "Forecast cost and margin", available: has("Project Summary"), explanation: has("Project Summary") ? "Explicit ETC values are available where supplied." : "Project Summary with explicit ETC was not supplied." },
    { analysis: "Labor productivity", available: has("Labor Actuals") && !laborHoursMissing, explanation: !has("Labor Actuals") ? "Labor data was not supplied." : laborHoursMissing ? "Labor dollars without hours disable productivity outputs." : "Labor hours and dollars are available." },
    { analysis: "Billing and collections", available: has("Revenue & Billing"), explanation: has("Revenue & Billing") ? "Billing facts are loaded separately." : "Billing data was not supplied." },
    { analysis: "Operational drivers", available: has("Operational Drivers"), explanation: has("Operational Drivers") ? "Operational quantities are available." : "Operational-driver data was not supplied." },
    { analysis: "Internal benchmarks", available: has("Benchmark Library"), explanation: has("Benchmark Library") ? "Uploaded benchmark ranges are available." : "No validated benchmark cohort was supplied." },
  ];
  return analyses.map((analysis) => Object.freeze(analysis));
}

export async function transformMappedImport(input: {
  mapped: MappedImportTables;
  files: readonly ImportFileDescriptor[];
  serverTime: string;
}): Promise<ValidatedImportPackage> {
  const issues: ImportIssue[] = [...input.mapped.issues];
  validateMappedValues(input.mapped, issues);
  const knownProjects = validateProjectRelationships(input.mapped, issues);
  additionalControlIssues(input.mapped, knownProjects, issues);
  const raw = buildRawInput(input.mapped, issues, input.serverTime);
  const source = new WorkbookDerivedTrailSolutionsDataSource(raw);
  const snapshot = await source.getSnapshot(trailSolutionsDemoContext);
  const details = Object.fromEntries(await Promise.all(snapshot.projects.map(async (project) => [
    project.projectId,
    await source.getProject(trailSolutionsDemoContext, asProjectId(project.projectId)),
  ])));
  const controls = controlTotals(input.mapped, raw, issues);
  const transactionCount = rows(input.mapped, "Labor Actuals").length + rows(input.mapped, "Nonlabor Actuals").length + rows(input.mapped, "Revenue & Billing").length;
  const preview: ImportPreview = Object.freeze({
    projectCount: raw.projects.length,
    transactionCount,
    totalEstimatedCost: rows(input.mapped, "Estimate Lines").length ? sum(raw.projects.map((project) => project.originalEstimatedCost)) : null,
    totalActualCost: sum(raw.projects.flatMap((project) => project.costBreakdown.map((line) => line[2]))),
    totalContractValue: sum(raw.projects.map((project) => project.originalContractValue + project.approvedChangeOrders)),
    laborHours: issues.some((candidate) => candidate.code === "LABOR_DOLLARS_WITHOUT_HOURS") ? null : sum(raw.projects.map((project) => project.actualLaborHours)),
    unmappedRecords: issues.filter((candidate) => /UNRECOGNIZED_PROJECT|MISSING_PROJECT|UNMAPPED/.test(candidate.code)).length,
    warningCount: issues.filter((candidate) => candidate.severity === "warning").length,
    rejectedRecordCount: issues.filter((candidate) => candidate.quarantined).length,
    controlTotals: controls,
  });
  return Object.freeze({
    attemptId: asImportAttemptId(crypto.randomUUID()),
    versionId: asImportVersionId(crypto.randomUUID()),
    occurredAt: input.serverTime,
    ingestedAt: input.serverTime,
    recordedAt: input.serverTime,
    files: input.files,
    readiness: importReadiness(issues),
    issues,
    preview,
    analyses: availability(input.mapped, issues),
    snapshot,
    projectDetails: Object.freeze(details),
    normalizedDataset: safeDataset(raw, issues),
  });
}
