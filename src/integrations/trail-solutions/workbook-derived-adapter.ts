import rawWorkbookDerivedData from "@/data/trail-solutions/workbook-derived-hypothetical.json";
import {
  asBenchmarkId,
  asChangeOrderId,
  asDataExceptionId,
  asDataRefreshStatusId,
  asDecisionItemId,
  asEstimateLineId,
  asEstimateVersionId,
  asGrantFundingRecordId,
  asForecastUpdateId,
  asLaborActualId,
  asNonlaborActualId,
  asMatchActivityId,
  asOperationalDriverId,
  asOrganizationId,
  asProjectId,
  asProjectIdentifierCrosswalkId,
  asRevenueBillingRecordId,
  asSharedCostAllocationRuleId,
  type OrganizationId,
  type ProjectId,
} from "@/core/primitives/identity";
import type {
  Benchmark,
  BenchmarkFilters,
  ChangeOrder,
  CostBreakdownLine,
  DataException,
  DataHealthSummary,
  DataRefreshStatus,
  DecisionItem,
  EstimateLine,
  EstimateVersion,
  FinancialHealthStatus,
  ForecastUpdate,
  GrantFundingRecord,
  LaborActual,
  MatchActivity,
  NonlaborActual,
  OperationalDriver,
  PortfolioSummary,
  Project,
  ProjectBusinessLine,
  ProjectDetail,
  ProjectFilters,
  ProjectFinancialSummary,
  ProjectIdentifierCrosswalk,
  RevenueBillingRecord,
  SharedCostAllocationRule,
  SourceEvidence,
  StaffingMixLine,
  TrailSolutionsSnapshot,
  VarianceDriver,
} from "@/core/trail-solutions/model";
import type {
  TrailSolutionsDataContext,
  TrailSolutionsDataSource,
} from "@/core/trail-solutions/data-source";
import { calculateProjectFinancials, summarizeBilling } from "@/core/trail-solutions/financials";
import { demoFinancialHealthPolicy, evaluateFinancialHealth } from "@/core/trail-solutions/policy";
import { calculateGrantAgreementControls, forecastIsStale, isCrossProjectLabor } from "@/core/trail-solutions/funding-controls";

type RawCostLine = [CostBreakdownLine["category"], number, number, number | null];
type RawStaffingLine = [string, number, number, number];
type RawCrosswalk = [string, string, string];
type RawBenchmark = [
  ProjectBusinessLine,
  string,
  string,
  number,
  number,
  number,
  number,
  Benchmark["confidence"],
  string,
  string,
  string,
  string,
];
type RawRefreshStatus = [
  string,
  DataRefreshStatus["mode"],
  DataRefreshStatus["status"],
  string | null,
  string,
  number,
];

interface RawDecision {
  issue: string;
  financialEffect?: number;
  financialEffectLabel: string;
  recommendedAction: string;
  owner: string;
  dueDate: string;
  supportingSection: DecisionItem["supportingSection"];
}

interface RawException {
  sourceSystem: string;
  sourceRecordId: string;
  recordDate: string;
  amount?: number;
  rawProjectCode?: string;
  rawCostCode?: string;
  exceptionType: DataException["exceptionType"];
  description: string;
  severity: DataException["severity"];
  owner: string;
  openedAt: string;
}

interface RawProjectPackage {
  projectId: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  businessLine: ProjectBusinessLine;
  projectManager: string;
  region: string;
  state: string;
  contractType: string;
  fundingType: string;
  projectStage: Project["projectStage"];
  startDate: string;
  expectedCompletionDate: string;
  originalContractValue: number;
  approvedChangeOrders: number;
  originalEstimatedCost: number;
  revisedBudgetCost: number;
  estimatedCostToComplete: number | null;
  dataQuality: ProjectFinancialSummary["dataQuality"];
  lastDataRefresh: string;
  estimatedLaborHours: number;
  actualLaborHours: number;
  forecastRemainingLaborHours: number | null;
  trailMiles: number;
  costBreakdown: RawCostLine[];
  staffingMix: RawStaffingLine[];
  billing: {
    recognizedRevenue: number;
    invoicedAmount: number;
    cashCollected: number;
    lastInvoiceDate: string;
    invoiceDueDate: string;
  };
  operationalDriver: Omit<OperationalDriver, "operationalDriverId" | "organizationId" | "chapterScope" | "projectId" | "snapshotDate">;
  crosswalks: RawCrosswalk[];
  pendingChangeOrder?: {
    changeNumber: string;
    identifiedDate: string;
    description: string;
    cause: string;
    additionalRevenue: number;
    additionalEstimatedCost: number;
    scheduleDays: number;
    approvalOwner: string;
  };
  grant?: Omit<GrantFundingRecord, "grantFundingRecordId" | "organizationId" | "chapterScope" | "projectId" | "restricted">;
  laborActuals?: Omit<LaborActual, "laborActualId" | "organizationId" | "chapterScope" | "projectId">[];
  nonlaborActuals?: Omit<NonlaborActual, "nonlaborActualId" | "organizationId" | "chapterScope" | "projectId">[];
  matchActivities?: Omit<MatchActivity, "matchActivityId" | "organizationId" | "chapterScope" | "projectId">[];
  forecastUpdates?: Omit<ForecastUpdate, "forecastUpdateId" | "organizationId" | "chapterScope" | "projectId">[];
  sharedCostAllocationRules?: Omit<SharedCostAllocationRule, "sharedCostAllocationRuleId" | "organizationId" | "chapterScope">[];
  exceptions?: RawException[];
  decisions: RawDecision[];
}

export interface RawWorkbookDerivedInput {
  metadata: {
    sourceName: string;
    workbookTemplate: string;
    transformVersion: number;
    sourceAsOfDate: string;
    organizationId: string;
    chapterScope: "NATIONAL";
    dataEnvironment?: "synthetic-demonstration" | "uploaded-test";
  };
  projects: RawProjectPackage[];
  unmappedSourceRecords: RawException[];
  benchmarks: RawBenchmark[];
  refreshStatuses: RawRefreshStatus[];
}

interface MaterializedData {
  organizationId: OrganizationId;
  projects: Project[];
  summaries: ProjectFinancialSummary[];
  details: Map<ProjectId, ProjectDetail>;
  benchmarks: Benchmark[];
  decisions: DecisionItem[];
  exceptions: DataException[];
  refreshStatuses: DataRefreshStatus[];
  portfolio: PortfolioSummary;
  dataHealth: DataHealthSummary;
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function assertFiniteNonnegative(value: number | null, label: string): void {
  if (value === null) return;
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be a finite nonnegative number`);
}

function validateInput(value: unknown): RawWorkbookDerivedInput {
  assertRecord(value, "workbook-derived input");
  assertRecord(value.metadata, "metadata");
  if (!Array.isArray(value.projects) || !Array.isArray(value.benchmarks) || !Array.isArray(value.refreshStatuses)) {
    throw new TypeError("projects, benchmarks, and refreshStatuses must be arrays");
  }
  const input = value as unknown as RawWorkbookDerivedInput;
  asOrganizationId(input.metadata.organizationId);
  if (input.metadata.chapterScope !== "NATIONAL") throw new TypeError("Trail Solutions demo scope must be NATIONAL");
  if (!Number.isSafeInteger(input.metadata.transformVersion) || input.metadata.transformVersion <= 0) {
    throw new TypeError("transformVersion must be a positive integer");
  }
  const projectIds = new Set<string>();
  const projectCodes = new Set<string>();
  for (const project of input.projects) {
    asProjectId(project.projectId);
    if (projectIds.has(project.projectId) || projectCodes.has(project.projectCode)) {
      throw new TypeError(`duplicate project identity: ${project.projectCode}`);
    }
    projectIds.add(project.projectId);
    projectCodes.add(project.projectCode);
    for (const [label, number] of [
      ["originalContractValue", project.originalContractValue],
      ["approvedChangeOrders", project.approvedChangeOrders],
      ["originalEstimatedCost", project.originalEstimatedCost],
      ["revisedBudgetCost", project.revisedBudgetCost],
      ["estimatedCostToComplete", project.estimatedCostToComplete],
      ["estimatedLaborHours", project.estimatedLaborHours],
      ["actualLaborHours", project.actualLaborHours],
      ["forecastRemainingLaborHours", project.forecastRemainingLaborHours],
    ] as const) assertFiniteNonnegative(number, `${project.projectCode}.${label}`);
    if (!project.costBreakdown.length || !project.staffingMix.length) {
      throw new TypeError(`${project.projectCode} must include cost and staffing detail`);
    }
    const estimatedCost = project.costBreakdown.reduce((total, [, estimate]) => total + estimate, 0);
    const remainingCost = project.costBreakdown.reduce((total, [, , , remaining]) => total + (remaining ?? 0), 0);
    const plannedHours = project.staffingMix.reduce((total, [, planned]) => total + planned, 0);
    const actualHours = project.staffingMix.reduce((total, [, , actual]) => total + actual, 0);
    if (Math.abs(estimatedCost - project.revisedBudgetCost) > 0.01) {
      throw new TypeError(`${project.projectCode} cost lines do not reconcile to revised budget`);
    }
    if (project.estimatedCostToComplete !== null && Math.abs(remainingCost - project.estimatedCostToComplete) > 0.01) {
      throw new TypeError(`${project.projectCode} remaining cost lines do not reconcile to estimate to complete`);
    }
    if (Math.abs(plannedHours - project.estimatedLaborHours) > 0.01 || Math.abs(actualHours - project.actualLaborHours) > 0.01) {
      throw new TypeError(`${project.projectCode} staffing hours do not reconcile`);
    }
  }
  return input;
}

function fixtureUuid(group: number, sequence: number): string {
  return `${group.toString(16).padStart(2, "0")}${sequence.toString(16).padStart(6, "0")}-0000-4000-8000-${sequence.toString(16).padStart(12, "0")}`;
}

function evidence(sourceSystem: string, sourceRecordId: string, sourceName: string): SourceEvidence {
  return Object.freeze({
    sourceSystem,
    sourceRecordId,
    sourceName,
    fingerprint: `${sourceSystem.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${sourceRecordId}`,
  });
}

export function deduplicateSourceRecords<T extends { source: SourceEvidence }>(records: readonly T[]): readonly T[] {
  const byId = new Map<string, T>();
  for (const record of records) {
    const key = `${record.source.sourceSystem}::${record.source.sourceRecordId}`;
    const existing = byId.get(key);
    if (!existing) {
      byId.set(key, record);
      continue;
    }
    if (existing.source.fingerprint !== record.source.fingerprint) {
      throw new TypeError(`conflicting duplicate source record: ${key}`);
    }
  }
  return Object.freeze([...byId.values()]);
}

function projectEntities(
  raw: RawProjectPackage,
  organizationId: OrganizationId,
  sourceName: string,
  projectSequence: number,
  isSynthetic: boolean,
): {
  project: Project;
  crosswalks: ProjectIdentifierCrosswalk[];
  estimateVersion: EstimateVersion;
  estimateLines: EstimateLine[];
  laborActuals: LaborActual[];
  nonlaborActuals: NonlaborActual[];
  billingRecords: RevenueBillingRecord[];
  changeOrders: ChangeOrder[];
  operationalDrivers: OperationalDriver[];
  grantFunding: GrantFundingRecord[];
  matchActivities: MatchActivity[];
  forecastUpdates: ForecastUpdate[];
  sharedCostAllocationRules: SharedCostAllocationRule[];
  decisions: DecisionItem[];
  exceptions: DataException[];
  summary: ProjectFinancialSummary;
} {
  const projectId = asProjectId(raw.projectId);
  const common = { organizationId, chapterScope: "NATIONAL" as const };
  const projectSource = evidence("Workbook-derived JSON", raw.projectCode, sourceName);
  const project: Project = Object.freeze({
    ...common,
    projectId,
    projectCode: raw.projectCode,
    projectName: raw.projectName,
    isSynthetic,
    clientName: raw.clientName,
    businessLine: raw.businessLine,
    projectManager: raw.projectManager,
    region: raw.region,
    state: raw.state,
    contractType: raw.contractType,
    fundingType: raw.fundingType,
    projectStage: raw.projectStage,
    startDate: raw.startDate,
    expectedCompletionDate: raw.expectedCompletionDate,
    originalContractValue: raw.originalContractValue,
    trailMiles: raw.trailMiles,
    source: projectSource,
  });

  const crosswalks = raw.crosswalks.map(([sourceSystem, sourceEntityType, externalIdentifier], index) =>
    Object.freeze({
      ...common,
      crosswalkId: asProjectIdentifierCrosswalkId(fixtureUuid(0x21 + projectSequence, index + 1)),
      projectId,
      sourceSystem,
      sourceEntityType,
      externalIdentifier,
      effectiveFrom: raw.startDate,
      mappingStatus: "mapped" as const,
      reviewedBy: isSynthetic ? "Synthetic demo reviewer" : "Import Lab mapping",
    }));
  const estimateVersionId = asEstimateVersionId(fixtureUuid(0x31, projectSequence));
  const estimateVersion: EstimateVersion = Object.freeze({
    ...common,
    estimateVersionId,
    projectId,
    versionLabel: isSynthetic ? "V-DEMO-1" : "IMPORTED-1",
    estimateDate: raw.startDate,
    approvalStatus: "approved",
    approvedDate: raw.startDate,
    sourceDocument: isSynthetic ? `PROP-${raw.projectCode}` : `IMPORT-${raw.projectCode}`,
    estimatedCostToComplete: raw.estimatedCostToComplete ?? undefined,
    forecastAsOf: raw.lastDataRefresh,
  });
  const estimateLines = raw.costBreakdown.map(([category, estimated], index): EstimateLine =>
    Object.freeze({
      ...common,
      estimateLineId: asEstimateLineId(fixtureUuid(0x32 + projectSequence, index + 1)),
      estimateVersionId,
      projectId,
      lineNumber: index + 1,
      projectPhase: index < 2 ? "Field execution" : "Project delivery",
      costCategory: category,
      resourceRoleOrItem: category,
      quantity: 1,
      unit: "Lump Sum",
      unitCost: estimated,
      estimatedCost: estimated,
      scopeNote: isSynthetic ? "Hypothetical workbook-derived estimate line." : "Sanitized imported estimate summary.",
      source: evidence("Workbook-derived JSON", `${raw.projectCode}-EST-${index + 1}`, sourceName),
    }));

  const directLaborActual = raw.costBreakdown.find(([category]) => category === "Direct labor")?.[2] ?? 0;
  const payrollBurdenActual = raw.costBreakdown.find(([category]) => category === "Payroll burden")?.[2] ?? 0;
  const totalActualHours = raw.staffingMix.reduce((total, [, , actual]) => total + actual, 0);
  const laborActuals = raw.laborActuals?.length
    ? raw.laborActuals.map((labor, index): LaborActual => Object.freeze({
      ...common,
      laborActualId: asLaborActualId(fixtureUuid(0x41 + projectSequence, index + 1)),
      projectId,
      ...labor,
      workPerformedProjectId: labor.workPerformedProjectId ?? projectId,
      employeeOrResource: labor.employeeOrResource ?? labor.resourceRole,
      crossProjectLabor: Boolean(labor.workPerformedProjectId && labor.adpChargedProjectId && labor.workPerformedProjectId !== labor.adpChargedProjectId),
    }))
    : raw.staffingMix.map(([role, , actualHours], index): LaborActual => {
    const share = totalActualHours > 0
      ? actualHours / totalActualHours
      : raw.staffingMix.length > 0
        ? 1 / raw.staffingMix.length
        : 0;
    const directWages = directLaborActual * share;
    const payrollBurden = payrollBurdenActual * share;
    return Object.freeze({
      ...common,
      laborActualId: asLaborActualId(fixtureUuid(0x41 + projectSequence, index + 1)),
      projectId,
      resourceRole: role,
      seniority: /lead/i.test(role) ? "lead" : /senior/i.test(role) ? "senior" : /crew|installer/i.test(role) ? "crew" : "standard",
      region: raw.region,
      workDate: raw.lastDataRefresh,
      payPeriodEnd: raw.lastDataRefresh,
      hours: actualHours,
      directWages,
      payrollBurden,
      fullyBurdenedLaborCost: directWages + payrollBurden,
      projectPhase: "Project delivery",
      costCode: `LAB-${index + 1}`,
      source: evidence("ADP", `${raw.projectCode}-LAB-${index + 1}`, sourceName),
    });
    });
  const nonlaborActuals = raw.nonlaborActuals?.length
    ? raw.nonlaborActuals.map((nonlabor, index): NonlaborActual => Object.freeze({
      ...common,
      nonlaborActualId: asNonlaborActualId(fixtureUuid(0x51 + projectSequence, index + 1)),
      projectId,
      ...nonlabor,
    }))
    : raw.costBreakdown
    .filter(([category, , actual]) => category !== "Direct labor" && category !== "Payroll burden" && actual > 0)
    .map(([category, , actual], index): NonlaborActual => Object.freeze({
      ...common,
      nonlaborActualId: asNonlaborActualId(fixtureUuid(0x51 + projectSequence, index + 1)),
      projectId,
      vendorOrPayee: isSynthetic ? `Synthetic ${category} source` : "Redacted imported source",
      businessDate: raw.lastDataRefresh,
      accountingDate: raw.lastDataRefresh,
      documentNumber: `${raw.projectCode}-COST-${index + 1}`,
      glAccount: category,
      costCategory: category,
      directOrIndirect: category === "Allocated indirect costs" ? "indirect" : "direct",
      projectPhase: "Project delivery",
      costCode: `COST-${index + 1}`,
      quantity: 1,
      unit: "Lump Sum",
      amount: actual,
      description: isSynthetic ? `Hypothetical ${category.toLowerCase()} actual.` : `Sanitized ${category.toLowerCase()} actual.`,
      supportStatus: "complete",
      source: evidence("QuickBooks Online", `${raw.projectCode}-COST-${index + 1}`, sourceName),
    }));

  const billingSeed = [
    ["invoice", raw.billing.invoicedAmount, raw.billing.lastInvoiceDate, raw.billing.invoiceDueDate],
    ["revenue-recognition", raw.billing.recognizedRevenue, raw.lastDataRefresh, undefined],
    ["cash-receipt", raw.billing.cashCollected, raw.lastDataRefresh, undefined],
  ] as const;
  const billingRecords = billingSeed.map(([recordType, amount, documentDate, dueDate], index): RevenueBillingRecord => Object.freeze({
    ...common,
    revenueBillingRecordId: asRevenueBillingRecordId(fixtureUuid(0x61 + projectSequence, index + 1)),
    projectId,
    recordType,
    documentDate,
    dueDate,
    documentNumber: `${raw.projectCode}-${recordType.toUpperCase()}-${index + 1}`,
    customerOrFundingSource: raw.clientName,
    amount,
    source: evidence("QuickBooks Online", `${raw.projectCode}-BILL-${index + 1}`, sourceName),
  }));

  const changeOrders: ChangeOrder[] = [];
  if (raw.approvedChangeOrders > 0) {
    changeOrders.push(Object.freeze({
      ...common,
      changeOrderId: asChangeOrderId(fixtureUuid(0x71, projectSequence)),
      projectId,
      changeNumber: "CO-DEMO-APPROVED",
      identifiedDate: raw.startDate,
      approvedDate: raw.startDate,
      description: "Synthetic approved scope adjustment.",
      cause: "Customer Scope Change",
      status: "approved",
      additionalRevenue: raw.approvedChangeOrders,
      additionalEstimatedCost: Math.max(raw.revisedBudgetCost - raw.originalEstimatedCost, 0),
      scheduleDays: 0,
      customerApproved: true,
      approvalOwner: "Synthetic client sponsor",
      sourceDocument: `CO-${raw.projectCode}-APPROVED`,
    }));
  }
  if (raw.pendingChangeOrder) {
    changeOrders.push(Object.freeze({
      ...common,
      changeOrderId: asChangeOrderId(fixtureUuid(0x72, projectSequence)),
      projectId,
      ...raw.pendingChangeOrder,
      status: "pending",
      customerApproved: false,
      sourceDocument: `CO-${raw.projectCode}-PENDING`,
    }));
  }

  const operationalDrivers: OperationalDriver[] = [Object.freeze({
    ...common,
    operationalDriverId: asOperationalDriverId(fixtureUuid(0x81, projectSequence)),
    projectId,
    snapshotDate: raw.lastDataRefresh,
    trailMiles: raw.trailMiles,
    ...raw.operationalDriver,
  })];
  const grantFunding: GrantFundingRecord[] = raw.grant ? [Object.freeze({
    ...common,
    grantFundingRecordId: asGrantFundingRecordId(fixtureUuid(0x82, projectSequence)),
    projectId,
    restricted: true,
    ...raw.grant,
  })] : [];
  const matchActivities: MatchActivity[] = (raw.matchActivities ?? []).map((activity, index) => Object.freeze({
    ...common,
    matchActivityId: asMatchActivityId(fixtureUuid(0x83 + projectSequence, index + 1)),
    projectId,
    ...activity,
    calculatedActivityValue: activity.calculatedActivityValue ?? Math.max(activity.quantityHours ?? 0, 0) * Math.max(activity.valuationRate ?? 0, 0),
    eligibleMatchValue: activity.eligibilityStatus === "Eligible"
      ? Math.max(activity.calculatedActivityValue ?? Math.max(activity.quantityHours ?? 0, 0) * Math.max(activity.valuationRate ?? 0, 0), 0) + Math.max(activity.documentedCashMatch, 0)
      : 0,
  }));
  const forecastUpdates: ForecastUpdate[] = (raw.forecastUpdates ?? []).map((forecast, index) => Object.freeze({
    ...common,
    forecastUpdateId: asForecastUpdateId(fixtureUuid(0x84 + projectSequence, index + 1)),
    projectId,
    ...forecast,
  }));
  const sharedCostAllocationRules: SharedCostAllocationRule[] = (raw.sharedCostAllocationRules ?? []).map((rule, index) => Object.freeze({
    ...common,
    sharedCostAllocationRuleId: asSharedCostAllocationRuleId(fixtureUuid(0x85, index + 1)),
    ...rule,
  }));
  const decisions = raw.decisions.map((decision, index): DecisionItem => Object.freeze({
    ...common,
    decisionItemId: asDecisionItemId(fixtureUuid(0x91 + projectSequence, index + 1)),
    projectId,
    ...decision,
    status: "open",
  }));
  const exceptions = (raw.exceptions ?? []).map((exception, index): DataException => Object.freeze({
    ...common,
    dataExceptionId: asDataExceptionId(fixtureUuid(0xa1 + projectSequence, index + 1)),
    suggestedProjectId: projectId,
    ...exception,
    status: "open",
  }));

  const costBreakdown: CostBreakdownLine[] = raw.costBreakdown.map(([category, estimated, actual, remaining]) =>
    Object.freeze({ category, estimated, actual, remaining, forecast: remaining === null ? null : actual + remaining }));
  const staffingMix: StaffingMixLine[] = raw.staffingMix.map(([role, plannedHours, actualHours, forecastRemainingHours]) =>
    Object.freeze({ role, plannedHours, actualHours, forecastRemainingHours }));
  const actualCostToDate = costBreakdown.reduce((total, line) => total + line.actual, 0);
  const approvedChangeOrders = changeOrders
    .filter((changeOrder) => changeOrder.status === "approved")
    .reduce((total, changeOrder) => total + changeOrder.additionalRevenue, 0);
  const financials = calculateProjectFinancials({
    originalContractValue: raw.originalContractValue,
    approvedChangeOrders,
    actualCostToDate,
    estimatedCostToComplete: raw.estimatedCostToComplete,
  });
  const billing = summarizeBilling(billingRecords, "2026-08-06");
  const unresolvedExceptionCount = exceptions.length;
  const estimatedLaborCost = costBreakdown
    .filter((line) => line.category === "Direct labor" || line.category === "Payroll burden")
    .reduce((total, line) => total + line.estimated, 0);
  const actualLaborCost = laborActuals.reduce((total, line) => total + line.fullyBurdenedLaborCost, 0);
  const forecastFinalLaborHours = raw.forecastRemainingLaborHours === null
    ? null
    : raw.actualLaborHours + raw.forecastRemainingLaborHours;
  const preHealth = {
    ...common,
    projectId,
    projectCode: raw.projectCode,
    projectName: raw.projectName,
    clientName: raw.clientName,
    businessLine: raw.businessLine,
    projectManager: raw.projectManager,
    region: raw.region,
    projectStage: raw.projectStage,
    contractType: raw.contractType,
    fundingType: raw.fundingType,
    startDate: raw.startDate,
    expectedCompletionDate: raw.expectedCompletionDate,
    originalContractValue: raw.originalContractValue,
    approvedChangeOrders,
    ...financials,
    originalEstimatedCost: raw.originalEstimatedCost,
    revisedBudgetCost: raw.revisedBudgetCost,
    actualCostToDate,
    estimatedCostToComplete: raw.estimatedCostToComplete,
    estimatedLaborHours: raw.estimatedLaborHours,
    actualLaborHours: raw.actualLaborHours,
    forecastRemainingLaborHours: raw.forecastRemainingLaborHours,
    forecastFinalLaborHours,
    estimatedLaborCost,
    actualLaborCost,
    ...billing,
    dataQuality: raw.dataQuality,
    unresolvedExceptionCount,
    lastDataRefresh: raw.lastDataRefresh,
  };
  const healthStatus = evaluateFinancialHealth(preHealth, "2026-08-06", demoFinancialHealthPolicy);
  const varianceDrivers = buildVarianceDrivers(raw, {
    ...preHealth,
    healthStatus,
    decisionsRequired: decisions,
    costBreakdown,
    staffingMix,
    sourceLabel: sourceName,
    sourceSystemIds: crosswalks,
    varianceDrivers: [],
  });
  const summary: ProjectFinancialSummary = Object.freeze({
    ...preHealth,
    healthStatus,
    varianceDrivers,
    decisionsRequired: decisions,
    costBreakdown,
    staffingMix,
    sourceLabel: sourceName,
    sourceSystemIds: crosswalks,
  });
  return {
    project,
    crosswalks,
    estimateVersion,
    estimateLines,
    laborActuals: [...deduplicateSourceRecords(laborActuals)],
    nonlaborActuals: [...deduplicateSourceRecords(nonlaborActuals)],
    billingRecords: [...deduplicateSourceRecords(billingRecords)],
    changeOrders,
    operationalDrivers,
    grantFunding,
    matchActivities,
    forecastUpdates,
    sharedCostAllocationRules,
    decisions,
    exceptions,
    summary,
  };
}

function buildVarianceDrivers(raw: RawProjectPackage, summary: ProjectFinancialSummary): readonly VarianceDriver[] {
  const drivers: VarianceDriver[] = [];
  if (
    summary.forecastFinalLaborHours !== null &&
    summary.estimatedLaborHours > 0 &&
    summary.forecastFinalLaborHours > summary.estimatedLaborHours * 1.1
  ) {
    const laborForecast = summary.costBreakdown
      .filter((line) => line.category === "Direct labor" || line.category === "Payroll burden")
      .reduce((total, line) => total + (line.forecast ?? 0), 0);
    const effect = laborForecast - summary.estimatedLaborCost;
    drivers.push(Object.freeze({
      driverType: "labor-hours",
      headline: "Labor hours are forecast above estimate",
      explanation: `${summary.projectName} is forecast to use ${Math.round(summary.forecastFinalLaborHours - summary.estimatedLaborHours).toLocaleString()} more hours than planned, adding approximately $${Math.round(effect).toLocaleString()} to forecast labor cost.`,
      financialEffect: effect,
      evidenceReferences: ["Estimate Lines.Quantity", "Labor Actuals.Hours", "Project Summary.Estimate to Complete ($)"],
    }));
  }
  const plannedSenior = raw.staffingMix.filter(([role]) => /lead|senior/i.test(role)).reduce((total, [, planned]) => total + planned, 0);
  const actualSenior = raw.staffingMix.filter(([role]) => /lead|senior/i.test(role)).reduce((total, [, , actual]) => total + actual, 0);
  const plannedSeniorShare = summary.estimatedLaborHours > 0 ? plannedSenior / summary.estimatedLaborHours : 0;
  const actualSeniorShare = summary.actualLaborHours > 0 ? actualSenior / summary.actualLaborHours : 0;
  if (actualSeniorShare > plannedSeniorShare + 0.04) {
    drivers.push(Object.freeze({
      driverType: "staffing-mix",
      headline: "More senior field time was used than planned",
      explanation: `Lead and senior roles represent ${(actualSeniorShare * 100).toFixed(0)}% of actual hours versus ${(plannedSeniorShare * 100).toFixed(0)}% in the approved staffing plan.`,
      evidenceReferences: ["Estimate Lines.Resource Role / Item", "Labor Actuals.Role", "Labor Actuals.Hours"],
    }));
  }
  if (raw.operationalDriver.scopeChangeWithoutApproval && raw.pendingChangeOrder) {
    drivers.push(Object.freeze({
      driverType: "scope-change",
      headline: "Scope changed without approved revenue",
      explanation: `${raw.pendingChangeOrder.description} The proposed $${raw.pendingChangeOrder.additionalRevenue.toLocaleString()} change order is not included in current contract value until approved.`,
      financialEffect: raw.pendingChangeOrder.additionalRevenue,
      evidenceReferences: ["Change Orders.Status", "Change Orders.Additional Revenue ($)", "Operational Drivers.Design Revisions"],
    }));
  }
  if (summary.unbilledAmount !== null && summary.currentContractValue > 0 && summary.unbilledAmount / summary.currentContractValue > 0.1) {
    drivers.push(Object.freeze({
      driverType: "billing-lag",
      headline: "Billing is behind documented delivery",
      explanation: `$${summary.unbilledAmount.toLocaleString()} of recognized project progress has not yet been invoiced. Invoiced revenue, recognized revenue, and cash are shown separately.`,
      financialEffect: summary.unbilledAmount,
      evidenceReferences: ["Revenue & Billing.Invoice Amount ($)", "Revenue & Billing.Revenue Recognized ($)", "Revenue & Billing.Cash Collected ($)"],
    }));
  }
  if (summary.healthStatus === "data-incomplete") {
    drivers.push(Object.freeze({
      driverType: "data-quality",
      headline: "The forecast is intentionally incomplete",
      explanation: "Additional review is required to identify the primary variance driver. Unresolved mappings or a missing estimate to complete prevent a reliable final-cost and margin calculation.",
      evidenceReferences: ["Unmapped Exceptions", "Project Summary.Estimate to Complete ($)"],
    }));
  }
  return Object.freeze(drivers);
}

function materialize(inputValue: unknown): MaterializedData {
  const input = validateInput(inputValue);
  const organizationId = asOrganizationId(input.metadata.organizationId);
  const summaries: ProjectFinancialSummary[] = [];
  const projects: Project[] = [];
  const details = new Map<ProjectId, ProjectDetail>();
  const decisions: DecisionItem[] = [];
  const exceptions: DataException[] = [];

  input.projects.forEach((raw, index) => {
    const entities = projectEntities(
      raw,
      organizationId,
      input.metadata.sourceName,
      index + 1,
      input.metadata.dataEnvironment !== "uploaded-test",
    );
    projects.push(entities.project);
    summaries.push(entities.summary);
    decisions.push(...entities.decisions);
    exceptions.push(...entities.exceptions);
    details.set(entities.project.projectId, Object.freeze({
      summary: entities.summary,
      operationalDrivers: entities.operationalDrivers,
      grantFunding: entities.grantFunding,
      matchActivities: entities.matchActivities,
      forecastUpdates: entities.forecastUpdates,
      sharedCostAllocationRules: entities.sharedCostAllocationRules,
      changeOrders: entities.changeOrders,
      laborActuals: entities.laborActuals,
      nonlaborActuals: entities.nonlaborActuals,
      billingRecords: entities.billingRecords,
    }));
  });
  input.unmappedSourceRecords.forEach((exception, index) => {
    exceptions.push(Object.freeze({
      organizationId,
      chapterScope: "NATIONAL",
      dataExceptionId: asDataExceptionId(fixtureUuid(0xb1, index + 1)),
      ...exception,
      status: "open",
    }));
  });

  const benchmarks = input.benchmarks.map((benchmark, index): Benchmark => {
    const [businessLine, metric, unit, sampleSize, low, median, high, confidence, region, complexityClass, applicableFrom, applicableTo] = benchmark;
    return Object.freeze({
      organizationId,
      chapterScope: "NATIONAL",
      benchmarkId: asBenchmarkId(fixtureUuid(0xc1, index + 1)),
      label: "IMBA historical benchmark",
      rangeLabel: "Validated internal range",
      businessLine,
      metric,
      unit,
      low,
      median,
      high,
      sampleSize,
      confidence,
      region,
      complexityClass,
      applicableFrom,
      applicableTo,
      sourceProjectSet: input.metadata.dataEnvironment === "uploaded-test"
        ? `Uploaded test workspace cohort ${index + 1}`
        : `Synthetic completed-project cohort ${index + 1}`,
      note: sampleSize < 5 ? "Sample is too small to support a reliable conclusion." : "Hypothetical demonstration range; validate against approved project history.",
    });
  });
  const refreshStatuses = input.refreshStatuses.map(([sourceName, mode, status, lastSuccessfulIngestedAt, sourceCoverage, exceptionCount], index): DataRefreshStatus => Object.freeze({
    organizationId,
    chapterScope: "NATIONAL",
    dataRefreshStatusId: asDataRefreshStatusId(fixtureUuid(0xd1, index + 1)),
    sourceName,
    mode,
    status,
    lastSuccessfulIngestedAt: lastSuccessfulIngestedAt ?? undefined,
    lastSuccessfulRecordedAt: lastSuccessfulIngestedAt ?? undefined,
    sourceCoverage,
    exceptionCount,
    productionWritesEnabled: false,
  }));

  const reliable = summaries.filter((summary) => summary.forecastFinalCost !== null && summary.healthStatus !== "data-incomplete");
  const reliableContract = reliable.reduce((total, summary) => total + summary.currentContractValue, 0);
  const forecastFinalCost = reliable.reduce((total, summary) => total + (summary.forecastFinalCost ?? 0), 0);
  const forecastGrossMargin = reliableContract - forecastFinalCost;
  const allDetails = Array.from(details.values());
  const agreementControls = allDetails.flatMap((detail) => detail.grantFunding.map((grant) => calculateGrantAgreementControls({
    grant,
    laborActuals: detail.laborActuals,
    nonlaborActuals: detail.nonlaborActuals,
    matchActivities: detail.matchActivities ?? [],
  })));
  const allForecasts = allDetails.flatMap((detail) => detail.forecastUpdates ?? []);
  const allLabor = allDetails.flatMap((detail) => detail.laborActuals);
  const staleForecastCount = allForecasts.filter((forecast) => forecast.status === "Stale" || forecastIsStale(forecast.forecastDate, input.metadata.sourceAsOfDate)).length;
  const crossProjectLaborCount = allLabor.filter(isCrossProjectLabor).length;
  const pendingMatchCount = allDetails.flatMap((detail) => detail.matchActivities ?? []).filter((activity) => activity.eligibilityStatus === "Pending").length;
  const outstandingReimbursement = allDetails.flatMap((detail) => detail.grantFunding).reduce((total, grant) => total + Math.max(0, grant.reimbursementsRequested - grant.reimbursementsReceived), 0);
  const awardCashExposure = agreementControls.reduce((total, controls) => total + controls.awardCashExposure, 0);
  const remainingMatchRequirement = agreementControls.reduce((total, controls) => total + controls.remainingMatchRequirement, 0);
  const healthCounts: Record<FinancialHealthStatus, number> = { "on-track": 0, watch: 0, "at-risk": 0, "data-incomplete": 0 };
  summaries.forEach((summary) => { healthCounts[summary.healthStatus] += 1; });
  const portfolio: PortfolioSummary = Object.freeze({
    organizationId,
    chapterScope: "NATIONAL",
    activeProjects: summaries.filter((summary) => summary.projectStage !== "Completed").length,
    totalCurrentContractValue: summaries.reduce((total, summary) => total + summary.currentContractValue, 0),
    actualCostToDate: summaries.reduce((total, summary) => total + summary.actualCostToDate, 0),
    forecastFinalCost,
    forecastGrossMargin,
    forecastGrossMarginPercent: reliableContract > 0 ? forecastGrossMargin / reliableContract : null,
    forecastCoverageProjects: reliable.length,
    outstandingReceivables: summaries.reduce((total, summary) => total + summary.outstandingReceivables, 0),
    unbilledAmount: summaries.reduce((total, summary) => total + (summary.unbilledAmount ?? 0), 0),
    projectsRequiringDecisions: new Set(decisions.filter((decision) => decision.status !== "complete").map((decision) => decision.projectId)).size,
    projectsWithDataExceptions: new Set(exceptions.filter((exception) => exception.status === "open").map((exception) => exception.suggestedProjectId ?? exception.projectId).filter(Boolean)).size,
    healthCounts,
    lastDataRefresh: input.metadata.sourceAsOfDate,
    outstandingReimbursement,
    awardCashExposure,
    remainingMatchRequirement,
    staleForecasts: staleForecastCount,
    crossProjectLaborRecordsRequiringReview: crossProjectLaborCount,
    pendingMatchEligibilityReviews: pendingMatchCount,
  });
  const openExceptions = exceptions.filter((exception) => exception.status === "open" || exception.status === "pending-review");
  const typeCount = (type: DataException["exceptionType"]) => openExceptions.filter((exception) => exception.exceptionType === type).length;
  const dataHealth: DataHealthSummary = Object.freeze({
    organizationId,
    chapterScope: "NATIONAL",
    exceptions: Object.freeze(exceptions),
    refreshStatuses: Object.freeze(refreshStatuses),
    unmappedProjectIdentifiers: typeCount("missing-project"),
    unmappedCostCodes: typeCount("missing-cost-code"),
    transactionsMissingProjectIds: typeCount("missing-project"),
    laborRecordsMissingHours: typeCount("missing-hours"),
    costsMissingOperationalQuantity: typeCount("missing-operational-quantity"),
    projectsWithoutCurrentEstimate: typeCount("missing-estimate"),
    projectsWithoutEstimateToComplete: typeCount("missing-estimate-to-complete"),
    billingReconciliationIssues: typeCount("billing-reconciliation"),
    fundingClassificationsRequiringReview: typeCount("funding-classification"),
    staleForecasts: staleForecastCount,
    crossProjectLaborRecordsRequiringReview: crossProjectLaborCount,
    pendingMatchEligibilityReviews: pendingMatchCount,
    awardCashExposureAboveThreshold: allDetails.reduce((count, detail) => count + detail.grantFunding.filter((grant) => calculateGrantAgreementControls({ grant, laborActuals: detail.laborActuals, nonlaborActuals: detail.nonlaborActuals, matchActivities: detail.matchActivities ?? [] }).awardCashExposure > 10000).length, 0),
    sourceControlTotals: Object.freeze([
      { source: "Workbook-derived JSON", recordType: "Projects", count: summaries.length, amount: portfolio.totalCurrentContractValue, status: "reconciled" as const },
      { source: "Workbook-derived JSON", recordType: "Actual project cost", count: summaries.length, amount: portfolio.actualCostToDate, status: "reconciled" as const },
      { source: "QuickBooks Online", recordType: "Quarantined transactions", count: openExceptions.filter((exception) => exception.sourceSystem === "QuickBooks Online").length, amount: openExceptions.filter((exception) => exception.sourceSystem === "QuickBooks Online").reduce((total, exception) => total + (exception.amount ?? 0), 0), status: "difference" as const },
    ]),
  });
  return { organizationId, projects, summaries, details, benchmarks, decisions, exceptions, refreshStatuses, portfolio, dataHealth };
}

function matchesFilters(project: ProjectFinancialSummary, filters?: ProjectFilters): boolean {
  if (!filters) return true;
  const isAll = (value: unknown) => value === undefined || value === "all";
  if (!isAll(filters.businessLine) && project.businessLine !== filters.businessLine) return false;
  if (!isAll(filters.projectManager) && project.projectManager !== filters.projectManager) return false;
  if (!isAll(filters.region) && project.region !== filters.region) return false;
  if (!isAll(filters.fundingType) && project.fundingType !== filters.fundingType) return false;
  if (!isAll(filters.clientName) && project.clientName !== filters.clientName) return false;
  if (!isAll(filters.projectStage) && project.projectStage !== filters.projectStage) return false;
  if (!isAll(filters.healthStatus) && project.healthStatus !== filters.healthStatus) return false;
  if (filters.decisionRequired !== undefined && (project.decisionsRequired.length > 0) !== filters.decisionRequired) return false;
  if (filters.query && !`${project.projectName} ${project.projectCode} ${project.clientName}`.toLowerCase().includes(filters.query.toLowerCase())) return false;
  return true;
}

export class WorkbookDerivedTrailSolutionsDataSource implements TrailSolutionsDataSource {
  readonly #data: MaterializedData;

  constructor(input: unknown = rawWorkbookDerivedData) {
    this.#data = materialize(input);
  }

  #assertContext(context: TrailSolutionsDataContext): void {
    if (context.organizationId !== this.#data.organizationId || context.chapterScope !== "NATIONAL") {
      throw new TypeError("Cross-organization or non-national Trail Solutions access is not allowed");
    }
  }

  async getPortfolioSummary(context: TrailSolutionsDataContext): Promise<PortfolioSummary> {
    this.#assertContext(context);
    return this.#data.portfolio;
  }

  async getProjects(context: TrailSolutionsDataContext, filters?: ProjectFilters): Promise<readonly ProjectFinancialSummary[]> {
    this.#assertContext(context);
    return Object.freeze(this.#data.summaries.filter((project) => matchesFilters(project, filters)));
  }

  async getProject(context: TrailSolutionsDataContext, projectId: ProjectId): Promise<ProjectDetail> {
    this.#assertContext(context);
    const project = this.#data.details.get(projectId);
    if (!project) throw new TypeError("Unknown projectId for this organization");
    return project;
  }

  async getBenchmarks(context: TrailSolutionsDataContext, filters?: BenchmarkFilters): Promise<readonly Benchmark[]> {
    this.#assertContext(context);
    return Object.freeze(this.#data.benchmarks.filter((benchmark) =>
      (!filters?.businessLine || filters.businessLine === "all" || benchmark.businessLine === filters.businessLine) &&
      (!filters?.region || filters.region === "all" || benchmark.region === filters.region) &&
      (!filters?.confidence || filters.confidence === "all" || benchmark.confidence === filters.confidence)));
  }

  async getExceptions(context: TrailSolutionsDataContext): Promise<readonly DataException[]> {
    this.#assertContext(context);
    return Object.freeze(this.#data.exceptions);
  }

  async getDecisionItems(context: TrailSolutionsDataContext): Promise<readonly DecisionItem[]> {
    this.#assertContext(context);
    return Object.freeze(this.#data.decisions);
  }

  async getDataHealth(context: TrailSolutionsDataContext): Promise<DataHealthSummary> {
    this.#assertContext(context);
    return this.#data.dataHealth;
  }

  async getSnapshot(context: TrailSolutionsDataContext): Promise<TrailSolutionsSnapshot> {
    this.#assertContext(context);
    return Object.freeze({
      organizationId: this.#data.organizationId,
      chapterScope: "NATIONAL",
      portfolio: this.#data.portfolio,
      projects: Object.freeze(this.#data.summaries),
      benchmarks: Object.freeze(this.#data.benchmarks),
      decisions: Object.freeze(this.#data.decisions),
      dataHealth: this.#data.dataHealth,
    });
  }
}

export const trailSolutionsDemoOrganizationId = asOrganizationId("90000000-0000-4000-8000-000000000001");
export const trailSolutionsDemoContext: TrailSolutionsDataContext = Object.freeze({
  organizationId: trailSolutionsDemoOrganizationId,
  chapterScope: "NATIONAL",
});
export const workbookDerivedTrailSolutionsDataSource = new WorkbookDerivedTrailSolutionsDataSource();
export const rawWorkbookDerivedInput = rawWorkbookDerivedData as unknown as RawWorkbookDerivedInput;
