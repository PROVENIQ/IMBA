import {
  asChangeOrderId,
  asDecisionItemId,
  asForecastUpdateId,
  asGrantFundingRecordId,
  asImportAttemptId,
  asImportVersionId,
  asMatchActivityId,
  asOperationalDriverId,
  asOrganizationId,
  asProjectId,
} from "@/core/primitives/identity";
import type { ProjectId } from "@/core/primitives/identity";
import type {
  ChangeOrder,
  DataHealthSummary,
  DecisionItem,
  FinancialHealthStatus,
  ForecastUpdate,
  GrantFundingRecord,
  GrantAgreementStatus,
  GrantFundingRole,
  MatchActivity,
  MatchEligibilityStatus,
  MatchApprovalStatus,
  MatchSupportStatus,
  MatchType,
  OperationalDriver,
  PortfolioSummary,
  ProjectBusinessLine,
  ProjectDetail,
  ProjectFinancialSummary,
  ProjectStage,
  RecordProvenance,
  TrailSolutionsSnapshot,
} from "@/core/trail-solutions/model";
import type { ValidatedImportPackage } from "@/core/trail-solutions/import-lab";
import { calculateProjectFinancials } from "@/core/trail-solutions/financials";
import {
  calculateEligibleMatchValue,
  calculateMatchActivityValue,
  forecastSnapshot,
} from "@/core/trail-solutions/funding-controls";
import { applyDetailMetricsToDataHealth, portfolioFromSnapshotProjects } from "@/core/trail-solutions/workspace-transforms";

// Manual create/edit for Trail Solutions. Every function here is PURE: it turns a
// form into — or folds a record into — a `ValidatedImportPackage`, the exact same
// artifact the bulk importer produces. The result is committed through the one
// existing write path (commitWorkspace), so manual and imported projects share one
// normalized model, one snapshot, one portfolio, and one audit/version history. No
// separate manual-data store exists.

const CHAPTER_SCOPE = "NATIONAL" as const;

// The acting identity (a RepoActor on the server, or the signed-in user client-side).
export interface ManualActor {
  readonly organizationId: string;
  readonly label: string;
}

export interface ManualOperationalDriverInput {
  readonly snapshotDate?: string;
  readonly source?: string;
  readonly owner?: string;
  readonly notes?: string;
  readonly trailMiles?: number;
  readonly terrainClass?: string;
  readonly siteAccessComplexity?: string;
  readonly siteVisits?: number;
  readonly stakeholderMeetings?: number;
  readonly designRevisions?: number;
  readonly permittingComplexity?: string;
  readonly crewSize?: number;
  readonly crewDays?: number;
  readonly equipmentDays?: number;
  readonly signsDesigned?: number;
  readonly signsFabricated?: number;
  readonly signsInstalled?: number;
  readonly travelMiles?: number;
  readonly lodgingNights?: number;
  readonly subcontractorCount?: number;
  readonly projectDurationDays?: number;
}

export interface ManualFundingInput {
  readonly externalAwardId: string;
  readonly funder: string;
  readonly grantType: string;
  readonly restricted: boolean;
  readonly awardAmount: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly reimbursementBasis: string;
  readonly matchType: string;
  readonly matchRequirement: number;
  readonly indirectRate?: number;
  readonly indirectMethod?: string;
  readonly reportingFrequency?: string;
  readonly nextReportDue?: string;
  readonly fundingRole?: GrantFundingRole;
  readonly agreementOwner?: string;
  readonly documentationStatus?: string;
  readonly agreementStatus?: GrantAgreementStatus;
  readonly notes?: string;
}

export interface ManualProjectInput {
  readonly projectCode: string;
  readonly projectName: string;
  readonly clientName: string;
  readonly businessLine: ProjectBusinessLine;
  readonly projectManager: string;
  readonly region: string;
  readonly projectStage: ProjectStage;
  readonly contractType: string;
  readonly fundingType: string;
  readonly startDate: string;
  readonly expectedCompletionDate: string;
  readonly originalContractValue: number;
  readonly currentContractValue?: number;
  readonly contractReferenceId?: string;
  readonly initialEstimatedCost: number;
  readonly pricingNotes?: string;
  readonly drivers?: ManualOperationalDriverInput;
  readonly funding?: ManualFundingInput;
}

export interface ManualForecastInput {
  readonly forecastDate: string;
  readonly forecastOwner: string;
  readonly etcSource: string;
  readonly estimateToComplete: number | null;
  readonly forecastCompletionDate?: string;
  readonly keyVarianceDriver?: string;
  readonly requiredAction?: string;
  readonly confidence: ForecastUpdate["confidence"];
  readonly notes?: string;
}

export interface ManualMatchInput {
  readonly grantAwardId: string;
  readonly activityDate: string;
  readonly matchType: MatchType;
  readonly contributorOrResource: string;
  readonly activityDescription: string;
  readonly quantityHours?: number;
  readonly unit?: string;
  readonly valuationRate?: number;
  readonly documentedCashMatch: number;
  readonly eligibilityStatus: MatchEligibilityStatus;
  readonly documentationSourceRecordId?: string;
  readonly supportStatus?: MatchSupportStatus;
  readonly approvalStatus?: MatchApprovalStatus;
  readonly notes?: string;
}

export interface ManualChangeOrderInput {
  readonly changeNumber: string;
  readonly identifiedDate: string;
  readonly approvedDate?: string;
  readonly status: ChangeOrder["status"];
  readonly additionalRevenue: number;
  readonly additionalEstimatedCost: number;
  readonly description: string;
  readonly cause?: string;
  readonly scheduleDays?: number;
  readonly customerApproved?: boolean;
  readonly approvalOwner: string;
  readonly sourceDocument?: string;
  readonly notes?: string;
}

export interface ManualDecisionInput {
  readonly issue: string;
  readonly financialEffect?: number;
  readonly financialEffectLabel: string;
  readonly recommendedAction: string;
  readonly owner: string;
  readonly dueDate: string;
  readonly status: DecisionItem["status"];
  readonly supportingSection?: DecisionItem["supportingSection"];
  readonly notes?: string;
}

function newId(): string {
  return crypto.randomUUID();
}

function manualProvenance(actor: ManualActor, serverTime: string): RecordProvenance {
  return { sourceType: "manual", createdBy: actor.label, createdAt: serverTime };
}

function touchProvenance(existing: RecordProvenance | undefined, actor: ManualActor, serverTime: string): RecordProvenance {
  const base = existing ?? { sourceType: "manual" as const, createdBy: actor.label, createdAt: serverTime };
  return { ...base, updatedBy: actor.label, updatedAt: serverTime };
}

function healthFromMargin(forecastMargin: number | null): FinancialHealthStatus {
  if (forecastMargin === null) return "data-incomplete";
  if (forecastMargin < 0) return "at-risk";
  return "on-track";
}

function emptyDataHealth(organizationId: ReturnType<typeof asOrganizationId>): DataHealthSummary {
  return {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    exceptions: [],
    refreshStatuses: [],
    unmappedProjectIdentifiers: 0,
    unmappedCostCodes: 0,
    transactionsMissingProjectIds: 0,
    laborRecordsMissingHours: 0,
    costsMissingOperationalQuantity: 0,
    projectsWithoutCurrentEstimate: 0,
    projectsWithoutEstimateToComplete: 0,
    billingReconciliationIssues: 0,
    fundingClassificationsRequiringReview: 0,
    staleForecasts: 0,
    sourceControlTotals: [],
  };
}

function emptyPortfolio(organizationId: ReturnType<typeof asOrganizationId>, lastDataRefresh: string): PortfolioSummary {
  return {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    activeProjects: 0,
    totalCurrentContractValue: 0,
    actualCostToDate: 0,
    forecastFinalCost: 0,
    forecastGrossMargin: 0,
    forecastGrossMarginPercent: null,
    forecastCoverageProjects: 0,
    outstandingReceivables: 0,
    unbilledAmount: 0,
    projectsRequiringDecisions: 0,
    projectsWithDataExceptions: 0,
    healthCounts: { "on-track": 0, watch: 0, "at-risk": 0, "data-incomplete": 0 },
    lastDataRefresh,
  };
}

function hasAnyDriver(drivers: ManualOperationalDriverInput): boolean {
  return Object.values(drivers).some((value) => value !== undefined && value !== "" && value !== null);
}

function buildOperationalDriver(
  input: ManualOperationalDriverInput,
  projectId: ProjectId,
  organizationId: ReturnType<typeof asOrganizationId>,
  actor: ManualActor,
  serverTime: string,
): OperationalDriver {
  return {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    operationalDriverId: asOperationalDriverId(newId()),
    projectId,
    snapshotDate: input.snapshotDate ?? serverTime,
    ...input,
    provenance: manualProvenance(actor, serverTime),
  };
}

function buildGrantFunding(
  input: ManualFundingInput,
  projectId: ProjectId,
  organizationId: ReturnType<typeof asOrganizationId>,
  actor: ManualActor,
  serverTime: string,
): GrantFundingRecord {
  return {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    grantFundingRecordId: asGrantFundingRecordId(newId()),
    projectId,
    externalAwardId: input.externalAwardId,
    funder: input.funder,
    grantType: input.grantType,
    restricted: input.restricted,
    awardAmount: input.awardAmount,
    startDate: input.startDate,
    endDate: input.endDate,
    reimbursementBasis: input.reimbursementBasis,
    matchType: input.matchType,
    matchRequirement: input.matchRequirement,
    eligibleCostToDate: 0,
    reimbursementsRequested: 0,
    reimbursementsReceived: 0,
    matchDocumented: 0,
    indirectRate: input.indirectRate ?? 0,
    reportingFrequency: input.reportingFrequency ?? "",
    nextReportDue: input.nextReportDue ?? "",
    indirectMethod: input.indirectMethod,
    fundingRole: input.fundingRole,
    agreementOwner: input.agreementOwner,
    documentationStatus: input.documentationStatus,
    agreementStatus: input.agreementStatus,
    notes: input.notes,
    provenance: manualProvenance(actor, serverTime),
  };
}

// Re-stamps a package as a new immutable version. Each manual create/edit becomes a
// fresh version row (new versionId/attemptId), so commitWorkspace never collides on
// its primary key and the full change history is preserved.
function restampPackage(pkg: ValidatedImportPackage, serverTime: string): ValidatedImportPackage {
  return {
    ...pkg,
    attemptId: asImportAttemptId(newId()),
    versionId: asImportVersionId(newId()),
    occurredAt: serverTime,
    ingestedAt: serverTime,
    recordedAt: serverTime,
  };
}

// Replaces one project's summary + detail inside a package and recomputes the
// portfolio. Needed because mergeValidatedPackages() rejects duplicate Project IDs —
// this is the "replace one project" path used for every edit / record-add.
export function replaceProjectInPackage(
  pkg: ValidatedImportPackage,
  summary: ProjectFinancialSummary,
  detail: ProjectDetail,
  serverTime: string,
): ValidatedImportPackage {
  const projects = pkg.snapshot.projects.map((project) => (project.projectId === summary.projectId ? summary : project));
  const snapshotBase: TrailSolutionsSnapshot = { ...pkg.snapshot, projects };
  const projectDetails = { ...pkg.projectDetails, [summary.projectId]: detail };
  const portfolio = portfolioFromSnapshotProjects(snapshotBase, projectDetails);
  const snapshotWithPortfolio: TrailSolutionsSnapshot = { ...snapshotBase, portfolio };
  const snapshot: TrailSolutionsSnapshot = {
    ...snapshotWithPortfolio,
    dataHealth: applyDetailMetricsToDataHealth(snapshotWithPortfolio.dataHealth, snapshotWithPortfolio, projectDetails),
  };
  return restampPackage(
    {
      ...pkg,
      snapshot,
      projectDetails,
    },
    serverTime,
  );
}

// Turns the New Project form into a one-project package (same shape the importer
// emits). Committed with mode "add" into the active workspace, or "create" when none
// exists — either way it lands in the same snapshot/portfolio as imported projects.
export function buildManualProjectPackage(
  input: ManualProjectInput,
  actor: ManualActor,
  serverTime: string,
): ValidatedImportPackage {
  const organizationId = asOrganizationId(actor.organizationId);
  const projectId = asProjectId(newId());
  const currentContractValue = input.currentContractValue ?? input.originalContractValue;
  const approvedChangeOrders = Math.max(0, currentContractValue - input.originalContractValue);
  const financials = calculateProjectFinancials({
    originalContractValue: input.originalContractValue,
    approvedChangeOrders,
    actualCostToDate: 0,
    estimatedCostToComplete: input.initialEstimatedCost,
  });

  const summary: ProjectFinancialSummary = {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    projectId,
    projectCode: input.projectCode,
    projectName: input.projectName,
    clientName: input.clientName,
    businessLine: input.businessLine,
    projectManager: input.projectManager,
    region: input.region,
    projectStage: input.projectStage,
    contractType: input.contractType,
    fundingType: input.fundingType,
    startDate: input.startDate,
    expectedCompletionDate: input.expectedCompletionDate,
    originalContractValue: input.originalContractValue,
    approvedChangeOrders,
    currentContractValue: financials.currentContractValue,
    originalEstimatedCost: input.initialEstimatedCost,
    revisedBudgetCost: input.initialEstimatedCost,
    actualCostToDate: 0,
    estimatedCostToComplete: input.initialEstimatedCost,
    forecastFinalCost: financials.forecastFinalCost,
    forecastMargin: financials.forecastMargin,
    forecastMarginPercent: financials.forecastMarginPercent,
    estimatedLaborHours: 0,
    actualLaborHours: 0,
    forecastRemainingLaborHours: null,
    forecastFinalLaborHours: null,
    estimatedLaborCost: 0,
    actualLaborCost: 0,
    invoicedAmount: 0,
    recognizedRevenue: 0,
    cashCollected: 0,
    outstandingReceivables: 0,
    unbilledAmount: null,
    collectionStatus: "not-billed",
    healthStatus: healthFromMargin(financials.forecastMargin),
    varianceDrivers: [],
    decisionsRequired: [],
    costBreakdown: [],
    staffingMix: [],
    dataQuality: "A",
    unresolvedExceptionCount: 0,
    lastDataRefresh: serverTime,
    sourceLabel: "Manual entry",
    sourceSystemIds: [],
    contractReferenceId: input.contractReferenceId,
    pricingNotes: input.pricingNotes,
    provenance: manualProvenance(actor, serverTime),
  };

  const operationalDrivers = input.drivers && hasAnyDriver(input.drivers)
    ? [buildOperationalDriver(input.drivers, projectId, organizationId, actor, serverTime)]
    : [];
  const grantFunding = input.funding
    ? [buildGrantFunding(input.funding, projectId, organizationId, actor, serverTime)]
    : [];

  const detail: ProjectDetail = {
    summary,
    operationalDrivers,
    grantFunding,
    changeOrders: [],
    laborActuals: [],
    nonlaborActuals: [],
    billingRecords: [],
    matchActivities: [],
    forecastUpdates: [],
    sharedCostAllocationRules: [],
  };

  const snapshotBase: TrailSolutionsSnapshot = {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    portfolio: emptyPortfolio(organizationId, serverTime),
    projects: [summary],
    benchmarks: [],
    decisions: [],
    dataHealth: emptyDataHealth(organizationId),
  };
  const projectDetails = { [projectId]: detail };
  const portfolio = portfolioFromSnapshotProjects(snapshotBase, projectDetails);
  const snapshotWithPortfolio: TrailSolutionsSnapshot = { ...snapshotBase, portfolio };
  const snapshot: TrailSolutionsSnapshot = {
    ...snapshotWithPortfolio,
    dataHealth: applyDetailMetricsToDataHealth(snapshotWithPortfolio.dataHealth, snapshotWithPortfolio, projectDetails),
  };

  return {
    attemptId: asImportAttemptId(newId()),
    versionId: asImportVersionId(newId()),
    occurredAt: serverTime,
    ingestedAt: serverTime,
    recordedAt: serverTime,
    files: [],
    readiness: "ready",
    issues: [],
    preview: {
      projectCount: 1,
      transactionCount: 0,
      totalEstimatedCost: input.initialEstimatedCost,
      totalActualCost: 0,
      totalContractValue: financials.currentContractValue,
      laborHours: 0,
      unmappedRecords: 0,
      warningCount: 0,
      rejectedRecordCount: 0,
      controlTotals: [],
    },
    analyses: [],
    snapshot,
    projectDetails: { [projectId]: detail },
    normalizedDataset: { tables: {} },
  };
}

function findProject(pkg: ValidatedImportPackage, projectId: string): { summary: ProjectFinancialSummary; detail: ProjectDetail } {
  const summary = pkg.snapshot.projects.find((project) => project.projectId === projectId);
  const detail = pkg.projectDetails[projectId];
  if (!summary || !detail) throw new TypeError(`Project ${projectId} is not in this workspace.`);
  return { summary, detail };
}

// Appends a forecast update (never overwrites prior forecasts — history is preserved
// and earlier "Current" forecasts are marked "Superseded"), recomputes the project's
// forecast economics, and recomputes the portfolio.
export function applyForecastUpdate(
  pkg: ValidatedImportPackage,
  projectId: string,
  input: ManualForecastInput,
  actor: ManualActor,
  serverTime: string,
): ValidatedImportPackage {
  const organizationId = asOrganizationId(actor.organizationId);
  const { summary, detail } = findProject(pkg, projectId);

  const snapshot = forecastSnapshot({
    projectId: summary.projectId,
    forecastDate: input.forecastDate,
    forecastOwner: input.forecastOwner,
    etcSource: input.etcSource,
    currentContractValueSnapshot: summary.currentContractValue,
    actualCostToDateSnapshot: summary.actualCostToDate,
    estimateToComplete: input.estimateToComplete,
    forecastCompletionDate: input.forecastCompletionDate,
    keyVarianceDriver: input.keyVarianceDriver,
    requiredAction: input.requiredAction,
    confidence: input.confidence,
    notes: input.notes,
  });

  const forecast: ForecastUpdate = {
    ...snapshot,
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    forecastUpdateId: asForecastUpdateId(newId()),
    provenance: manualProvenance(actor, serverTime),
  };

  const priorSuperseded = (detail.forecastUpdates ?? []).map((prior) =>
    prior.status === "Current" ? { ...prior, status: "Superseded" as const } : prior,
  );

  const financials = calculateProjectFinancials({
    originalContractValue: summary.originalContractValue,
    approvedChangeOrders: summary.approvedChangeOrders,
    actualCostToDate: summary.actualCostToDate,
    estimatedCostToComplete: input.estimateToComplete,
  });

  const updatedSummary: ProjectFinancialSummary = {
    ...summary,
    estimatedCostToComplete: input.estimateToComplete,
    forecastFinalCost: financials.forecastFinalCost,
    forecastMargin: financials.forecastMargin,
    forecastMarginPercent: financials.forecastMarginPercent,
    healthStatus: healthFromMargin(financials.forecastMargin),
    lastDataRefresh: serverTime,
    provenance: touchProvenance(summary.provenance, actor, serverTime),
  };

  const updatedDetail: ProjectDetail = {
    ...detail,
    summary: updatedSummary,
    forecastUpdates: [...priorSuperseded, forecast],
  };

  return replaceProjectInPackage(pkg, updatedSummary, updatedDetail, serverTime);
}

// Records a match activity. Activity value is computed from quantity × rate when
// both are present; only "Eligible" records contribute to accumulated match
// (eligibleMatchValue is 0 otherwise). Downstream grant controls derive from these.
export function applyMatchActivity(
  pkg: ValidatedImportPackage,
  projectId: string,
  input: ManualMatchInput,
  actor: ManualActor,
  serverTime: string,
): ValidatedImportPackage {
  const organizationId = asOrganizationId(actor.organizationId);
  const { summary, detail } = findProject(pkg, projectId);

  const calculatedActivityValue = calculateMatchActivityValue(input.quantityHours, input.valuationRate);
  const eligibleMatchValue = calculateEligibleMatchValue({
    calculatedActivityValue,
    documentedCashMatch: input.documentedCashMatch,
    eligibilityStatus: input.eligibilityStatus,
  });

  const activity: MatchActivity = {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    matchActivityId: asMatchActivityId(newId()),
    projectId: summary.projectId,
    grantAwardId: input.grantAwardId,
    activityDate: input.activityDate,
    matchType: input.matchType,
    contributorOrResource: input.contributorOrResource,
    activityDescription: input.activityDescription,
    quantityHours: input.quantityHours,
    unit: input.unit,
    valuationRate: input.valuationRate,
    calculatedActivityValue,
    documentedCashMatch: input.documentedCashMatch,
    eligibilityStatus: input.eligibilityStatus,
    eligibleMatchValue,
    documentationSourceRecordId: input.documentationSourceRecordId,
    supportStatus: input.supportStatus ?? "Complete",
    approvalStatus: input.approvalStatus ?? (input.eligibilityStatus === "Eligible" ? "Approved" : "Pending"),
    sourceSystem: "Manual entry",
    notes: input.notes,
    provenance: manualProvenance(actor, serverTime),
  };

  const updatedDetail: ProjectDetail = {
    ...detail,
    matchActivities: [...(detail.matchActivities ?? []), activity],
  };

  return replaceProjectInPackage(pkg, summary, updatedDetail, serverTime);
}

export function applyOperationalDriver(
  pkg: ValidatedImportPackage,
  projectId: string,
  input: ManualOperationalDriverInput,
  actor: ManualActor,
  serverTime: string,
): ValidatedImportPackage {
  const organizationId = asOrganizationId(actor.organizationId);
  const { summary, detail } = findProject(pkg, projectId);
  const driver = buildOperationalDriver(input, summary.projectId, organizationId, actor, serverTime);
  return replaceProjectInPackage(pkg, summary, {
    ...detail,
    operationalDrivers: [...detail.operationalDrivers, driver],
  }, serverTime);
}

export function applyChangeOrder(
  pkg: ValidatedImportPackage,
  projectId: string,
  input: ManualChangeOrderInput,
  actor: ManualActor,
  serverTime: string,
): ValidatedImportPackage {
  const organizationId = asOrganizationId(actor.organizationId);
  const { summary, detail } = findProject(pkg, projectId);
  const changeOrder: ChangeOrder = {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    changeOrderId: asChangeOrderId(newId()),
    projectId: summary.projectId,
    changeNumber: input.changeNumber,
    identifiedDate: input.identifiedDate,
    approvedDate: input.approvedDate,
    description: input.description,
    cause: input.cause ?? "Manual project-management entry",
    status: input.status,
    additionalRevenue: input.additionalRevenue,
    additionalEstimatedCost: input.additionalEstimatedCost,
    scheduleDays: input.scheduleDays ?? 0,
    customerApproved: input.customerApproved ?? input.status === "approved",
    approvalOwner: input.approvalOwner,
    sourceDocument: input.sourceDocument ?? "Manual entry",
    notes: input.notes,
    provenance: manualProvenance(actor, serverTime),
  };
  const approvedRevenue = changeOrder.status === "approved" ? changeOrder.additionalRevenue : 0;
  const approvedCost = changeOrder.status === "approved" ? changeOrder.additionalEstimatedCost : 0;
  const approvedChangeOrders = summary.approvedChangeOrders + approvedRevenue;
  const financials = calculateProjectFinancials({
    originalContractValue: summary.originalContractValue,
    approvedChangeOrders,
    actualCostToDate: summary.actualCostToDate,
    estimatedCostToComplete: summary.estimatedCostToComplete,
  });
  const updatedSummary: ProjectFinancialSummary = {
    ...summary,
    approvedChangeOrders,
    currentContractValue: financials.currentContractValue,
    revisedBudgetCost: summary.revisedBudgetCost + approvedCost,
    forecastFinalCost: financials.forecastFinalCost,
    forecastMargin: financials.forecastMargin,
    forecastMarginPercent: financials.forecastMarginPercent,
    healthStatus: healthFromMargin(financials.forecastMargin),
    lastDataRefresh: serverTime,
    provenance: touchProvenance(summary.provenance, actor, serverTime),
  };
  return replaceProjectInPackage(pkg, updatedSummary, {
    ...detail,
    summary: updatedSummary,
    changeOrders: [...detail.changeOrders, changeOrder],
  }, serverTime);
}

export function applyFundingAgreement(
  pkg: ValidatedImportPackage,
  projectId: string,
  input: ManualFundingInput,
  actor: ManualActor,
  serverTime: string,
): ValidatedImportPackage {
  const organizationId = asOrganizationId(actor.organizationId);
  const { summary, detail } = findProject(pkg, projectId);
  const funding = buildGrantFunding(input, summary.projectId, organizationId, actor, serverTime);
  return replaceProjectInPackage(pkg, summary, {
    ...detail,
    grantFunding: [...detail.grantFunding, funding],
  }, serverTime);
}

export function applyDecisionAction(
  pkg: ValidatedImportPackage,
  projectId: string,
  input: ManualDecisionInput,
  actor: ManualActor,
  serverTime: string,
): ValidatedImportPackage {
  const organizationId = asOrganizationId(actor.organizationId);
  const { summary, detail } = findProject(pkg, projectId);
  const decision: DecisionItem = {
    organizationId,
    chapterScope: CHAPTER_SCOPE,
    decisionItemId: asDecisionItemId(newId()),
    projectId: summary.projectId,
    issue: input.issue,
    financialEffect: input.financialEffect,
    financialEffectLabel: input.financialEffectLabel,
    recommendedAction: input.recommendedAction,
    owner: input.owner,
    dueDate: input.dueDate,
    status: input.status,
    supportingSection: input.supportingSection ?? "what-changed",
    notes: input.notes,
    provenance: manualProvenance(actor, serverTime),
  };
  const updatedSummary: ProjectFinancialSummary = {
    ...summary,
    decisionsRequired: [...summary.decisionsRequired, decision],
    lastDataRefresh: serverTime,
    provenance: touchProvenance(summary.provenance, actor, serverTime),
  };
  const withProject = replaceProjectInPackage(pkg, updatedSummary, { ...detail, summary: updatedSummary }, serverTime);
  return { ...withProject, snapshot: { ...withProject.snapshot, decisions: [...withProject.snapshot.decisions, decision] } };
}
