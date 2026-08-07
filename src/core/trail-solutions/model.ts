import type {
  BenchmarkId,
  ChangeOrderId,
  CostCodeMappingId,
  DataExceptionId,
  DataRefreshStatusId,
  DecisionItemId,
  EstimateLineId,
  EstimateVersionId,
  GrantFundingRecordId,
  LaborActualId,
  LaborRateId,
  NonlaborActualId,
  OperationalDriverId,
  OrganizationId,
  ProjectId,
  ProjectIdentifierCrosswalkId,
  RevenueBillingRecordId,
} from "@/core/primitives/identity";

export const TRAIL_SOLUTIONS_SYNTHETIC_BANNER =
  "Synthetic demonstration data — not connected to IMBA systems.";

export type ProjectBusinessLine =
  | "Planning & Design"
  | "Construction"
  | "Signage"
  | "Education & Training"
  | "Grants & Agreements"
  | "Unclassified";

export type FinancialHealthStatus =
  | "on-track"
  | "watch"
  | "at-risk"
  | "data-incomplete";

export type ProjectStage =
  | "Scoping"
  | "Active"
  | "Closeout"
  | "On hold"
  | "Completed"
  | "Unknown";

export type CostCategory =
  | "Direct labor"
  | "Payroll burden"
  | "Travel and lodging"
  | "Materials"
  | "Equipment"
  | "Subcontractors"
  | "Project management"
  | "Allocated indirect costs"
  | "Contingency"
  | "Other project costs";

export interface TenantOwnedRecord {
  readonly organizationId: OrganizationId;
  readonly chapterScope: "NATIONAL";
}

export interface SourceEvidence {
  readonly sourceSystem: string;
  readonly sourceRecordId: string;
  readonly sourceName: string;
  readonly sourceField?: string;
  readonly fingerprint: string;
}

export interface Project extends TenantOwnedRecord {
  readonly projectId: ProjectId;
  readonly projectCode: string;
  readonly projectName: string;
  readonly isSynthetic: boolean;
  readonly clientName: string;
  readonly businessLine: ProjectBusinessLine;
  readonly projectManager: string;
  readonly region: string;
  readonly state: string;
  readonly contractType: string;
  readonly fundingType: string;
  readonly projectStage: ProjectStage;
  readonly startDate: string;
  readonly expectedCompletionDate: string;
  readonly originalContractValue: number;
  readonly trailMiles?: number;
  readonly source: SourceEvidence;
}

export interface ProjectIdentifierCrosswalk extends TenantOwnedRecord {
  readonly crosswalkId: ProjectIdentifierCrosswalkId;
  readonly projectId: ProjectId;
  readonly sourceSystem: string;
  readonly sourceEntityType: string;
  readonly externalIdentifier: string;
  readonly externalName?: string;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly mappingStatus: "mapped" | "pending-review" | "unmapped";
  readonly reviewedBy?: string;
}

export interface EstimateVersion extends TenantOwnedRecord {
  readonly estimateVersionId: EstimateVersionId;
  readonly projectId: ProjectId;
  readonly versionLabel: string;
  readonly estimateDate: string;
  readonly approvalStatus: "draft" | "pending" | "approved" | "superseded";
  readonly approvedDate?: string;
  readonly sourceDocument: string;
  readonly estimatedCostToComplete?: number;
  readonly forecastAsOf?: string;
}

export interface EstimateLine extends TenantOwnedRecord {
  readonly estimateLineId: EstimateLineId;
  readonly estimateVersionId: EstimateVersionId;
  readonly projectId: ProjectId;
  readonly lineNumber: number;
  readonly projectPhase: string;
  readonly costCategory: CostCategory;
  readonly resourceRoleOrItem: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitCost: number;
  readonly estimatedCost: number;
  readonly proposedPrice?: number;
  readonly scopeNote: string;
  readonly source: SourceEvidence;
}

export interface LaborActual extends TenantOwnedRecord {
  readonly laborActualId: LaborActualId;
  readonly projectId?: ProjectId;
  readonly suggestedProjectId?: ProjectId;
  readonly resourceRole: string;
  readonly seniority: "lead" | "senior" | "standard" | "crew";
  readonly region: string;
  readonly workDate: string;
  readonly payPeriodEnd: string;
  readonly hours: number;
  readonly directWages: number;
  readonly payrollBurden: number;
  readonly fullyBurdenedLaborCost: number;
  readonly projectPhase: string;
  readonly costCode: string;
  readonly source: SourceEvidence;
}

export interface NonlaborActual extends TenantOwnedRecord {
  readonly nonlaborActualId: NonlaborActualId;
  readonly projectId?: ProjectId;
  readonly suggestedProjectId?: ProjectId;
  readonly vendorOrPayee: string;
  readonly businessDate: string;
  readonly accountingDate: string;
  readonly documentNumber: string;
  readonly glAccount: string;
  readonly costCategory: CostCategory;
  readonly directOrIndirect: "direct" | "indirect";
  readonly projectPhase: string;
  readonly costCode: string;
  readonly quantity?: number;
  readonly unit?: string;
  readonly amount: number;
  readonly description: string;
  readonly supportStatus: "complete" | "partial" | "missing" | "not-required";
  readonly source: SourceEvidence;
}

export type RevenueBillingRecordType =
  | "contract"
  | "invoice"
  | "revenue-recognition"
  | "cash-receipt"
  | "reimbursement-request"
  | "reimbursement-receipt";

export interface RevenueBillingRecord extends TenantOwnedRecord {
  readonly revenueBillingRecordId: RevenueBillingRecordId;
  readonly projectId: ProjectId;
  readonly recordType: RevenueBillingRecordType;
  readonly documentDate: string;
  readonly dueDate?: string;
  readonly documentNumber: string;
  readonly customerOrFundingSource: string;
  readonly amount: number;
  readonly source: SourceEvidence;
}

export interface ChangeOrder extends TenantOwnedRecord {
  readonly changeOrderId: ChangeOrderId;
  readonly projectId: ProjectId;
  readonly changeNumber: string;
  readonly identifiedDate: string;
  readonly approvedDate?: string;
  readonly description: string;
  readonly cause: string;
  readonly status: "draft" | "pending" | "approved" | "rejected";
  readonly additionalRevenue: number;
  readonly additionalEstimatedCost: number;
  readonly scheduleDays: number;
  readonly customerApproved: boolean;
  readonly approvalOwner: string;
  readonly sourceDocument: string;
}

export interface OperationalDriver extends TenantOwnedRecord {
  readonly operationalDriverId: OperationalDriverId;
  readonly projectId: ProjectId;
  readonly snapshotDate: string;
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
  readonly weatherDelayDays?: number;
  readonly customerDelayDays?: number;
  readonly projectDurationDays?: number;
  readonly scopeChangeWithoutApproval?: boolean;
}

export interface GrantFundingRecord extends TenantOwnedRecord {
  readonly grantFundingRecordId: GrantFundingRecordId;
  readonly projectId: ProjectId;
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
  readonly eligibleCostToDate: number;
  readonly reimbursementsRequested: number;
  readonly reimbursementsReceived: number;
  readonly matchDocumented: number;
  readonly indirectRate: number;
  readonly reportingFrequency: string;
  readonly nextReportDue: string;
}

export interface LaborRate extends TenantOwnedRecord {
  readonly laborRateId: LaborRateId;
  readonly role: string;
  readonly region: string;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly compensationBasis: "salaried" | "hourly" | "contractor";
  readonly productiveHours: number;
  readonly directHourlyCost: number;
  readonly fullyBurdenedHourlyCost: number;
  readonly billingRate: number;
  readonly sourceApproval: string;
}

export interface CostCodeMapping extends TenantOwnedRecord {
  readonly costCodeMappingId: CostCodeMappingId;
  readonly sourceSystem: string;
  readonly sourceCode: string;
  readonly sourceDescription: string;
  readonly standardBusinessLine: ProjectBusinessLine;
  readonly standardProjectPhase: string;
  readonly standardCostCategory: CostCategory;
  readonly directOrIndirect: "direct" | "indirect";
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly mappingStatus: "mapped" | "pending-review" | "unmapped";
  readonly approvedBy?: string;
}

export type DataExceptionType =
  | "missing-project"
  | "missing-cost-code"
  | "conflicting-mapping"
  | "missing-hours"
  | "missing-operational-quantity"
  | "missing-estimate"
  | "missing-estimate-to-complete"
  | "billing-reconciliation"
  | "funding-classification"
  | "stale-forecast"
  | "duplicate-record";

export interface DataException extends TenantOwnedRecord {
  readonly dataExceptionId: DataExceptionId;
  readonly projectId?: ProjectId;
  readonly suggestedProjectId?: ProjectId;
  readonly sourceSystem: string;
  readonly sourceRecordId: string;
  readonly recordDate: string;
  readonly amount?: number;
  readonly rawProjectCode?: string;
  readonly rawCostCode?: string;
  readonly exceptionType: DataExceptionType;
  readonly description: string;
  readonly status: "open" | "pending-review" | "resolved" | "closed";
  readonly severity: "low" | "moderate" | "high";
  readonly owner: string;
  readonly openedAt: string;
  readonly resolvedAt?: string;
  readonly resolution?: string;
}

export interface VarianceDriver {
  readonly driverType:
    | "labor-hours"
    | "staffing-mix"
    | "travel"
    | "operational-production"
    | "scope-change"
    | "billing-lag"
    | "data-quality";
  readonly headline: string;
  readonly explanation: string;
  readonly financialEffect?: number;
  readonly evidenceReferences: readonly string[];
}

export interface DecisionItem extends TenantOwnedRecord {
  readonly decisionItemId: DecisionItemId;
  readonly projectId: ProjectId;
  readonly issue: string;
  readonly financialEffect?: number;
  readonly financialEffectLabel: string;
  readonly recommendedAction: string;
  readonly owner: string;
  readonly dueDate: string;
  readonly status: "open" | "in-progress" | "complete";
  readonly supportingSection: "what-changed" | "labor" | "billing" | "data-health" | "grant";
}

export interface CostBreakdownLine {
  readonly category: CostCategory;
  readonly estimated: number;
  readonly actual: number;
  readonly remaining: number | null;
  readonly forecast: number | null;
}

export interface StaffingMixLine {
  readonly role: string;
  readonly plannedHours: number;
  readonly actualHours: number;
  readonly forecastRemainingHours: number;
}

export interface ProjectFinancialSummary extends TenantOwnedRecord {
  readonly projectId: ProjectId;
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
  readonly approvedChangeOrders: number;
  readonly currentContractValue: number;

  readonly originalEstimatedCost: number;
  readonly revisedBudgetCost: number;
  readonly actualCostToDate: number;
  readonly estimatedCostToComplete: number | null;
  readonly forecastFinalCost: number | null;

  readonly forecastMargin: number | null;
  readonly forecastMarginPercent: number | null;

  readonly estimatedLaborHours: number;
  readonly actualLaborHours: number;
  readonly forecastRemainingLaborHours: number | null;
  readonly forecastFinalLaborHours: number | null;
  readonly estimatedLaborCost: number;
  readonly actualLaborCost: number;

  readonly invoicedAmount: number;
  readonly recognizedRevenue: number;
  readonly cashCollected: number;
  readonly outstandingReceivables: number;
  readonly unbilledAmount: number | null;
  readonly lastInvoiceDate?: string;
  readonly collectionStatus: "current" | "attention" | "overdue" | "not-billed";

  readonly healthStatus: FinancialHealthStatus;
  readonly varianceDrivers: readonly VarianceDriver[];
  readonly decisionsRequired: readonly DecisionItem[];
  readonly costBreakdown: readonly CostBreakdownLine[];
  readonly staffingMix: readonly StaffingMixLine[];
  readonly dataQuality: "A" | "B" | "C" | "D";
  readonly unresolvedExceptionCount: number;
  readonly lastDataRefresh: string;
  readonly sourceLabel: string;
  readonly sourceSystemIds: readonly ProjectIdentifierCrosswalk[];
}

export interface ProjectDetail {
  readonly summary: ProjectFinancialSummary;
  readonly operationalDrivers: readonly OperationalDriver[];
  readonly grantFunding: readonly GrantFundingRecord[];
  readonly changeOrders: readonly ChangeOrder[];
  readonly laborActuals: readonly LaborActual[];
  readonly nonlaborActuals: readonly NonlaborActual[];
  readonly billingRecords: readonly RevenueBillingRecord[];
}

export interface Benchmark extends TenantOwnedRecord {
  readonly benchmarkId: BenchmarkId;
  readonly label: "IMBA historical benchmark";
  readonly rangeLabel: "Validated internal range";
  readonly businessLine: ProjectBusinessLine;
  readonly metric: string;
  readonly unit: string;
  readonly low: number;
  readonly median: number;
  readonly high: number;
  readonly sampleSize: number;
  readonly confidence: "low" | "moderate" | "high";
  readonly region: string;
  readonly complexityClass: string;
  readonly applicableFrom: string;
  readonly applicableTo: string;
  readonly sourceProjectSet: string;
  readonly note?: string;
}

export interface DataRefreshStatus extends TenantOwnedRecord {
  readonly dataRefreshStatusId: DataRefreshStatusId;
  readonly sourceName: string;
  readonly mode: "mock" | "live-readonly" | "live-write";
  readonly status: "current" | "stale" | "failed" | "not-connected";
  readonly lastSuccessfulIngestedAt?: string;
  readonly lastSuccessfulRecordedAt?: string;
  readonly sourceCoverage: string;
  readonly exceptionCount: number;
  readonly productionWritesEnabled: false;
}

export interface ProjectFilters {
  readonly businessLine?: ProjectBusinessLine | "all";
  readonly projectManager?: string | "all";
  readonly region?: string | "all";
  readonly fundingType?: string | "all";
  readonly clientName?: string | "all";
  readonly projectStage?: ProjectStage | "all";
  readonly healthStatus?: FinancialHealthStatus | "all";
  readonly decisionRequired?: boolean;
  readonly query?: string;
}

export interface BenchmarkFilters {
  readonly businessLine?: ProjectBusinessLine | "all";
  readonly region?: string | "all";
  readonly confidence?: Benchmark["confidence"] | "all";
}

export interface PortfolioSummary extends TenantOwnedRecord {
  readonly activeProjects: number;
  readonly totalCurrentContractValue: number;
  readonly actualCostToDate: number;
  readonly forecastFinalCost: number;
  readonly forecastGrossMargin: number;
  readonly forecastGrossMarginPercent: number | null;
  readonly forecastCoverageProjects: number;
  readonly outstandingReceivables: number;
  readonly unbilledAmount: number;
  readonly projectsRequiringDecisions: number;
  readonly projectsWithDataExceptions: number;
  readonly healthCounts: Readonly<Record<FinancialHealthStatus, number>>;
  readonly lastDataRefresh: string;
}

export interface DataHealthSummary extends TenantOwnedRecord {
  readonly exceptions: readonly DataException[];
  readonly refreshStatuses: readonly DataRefreshStatus[];
  readonly unmappedProjectIdentifiers: number;
  readonly unmappedCostCodes: number;
  readonly transactionsMissingProjectIds: number;
  readonly laborRecordsMissingHours: number;
  readonly costsMissingOperationalQuantity: number;
  readonly projectsWithoutCurrentEstimate: number;
  readonly projectsWithoutEstimateToComplete: number;
  readonly billingReconciliationIssues: number;
  readonly fundingClassificationsRequiringReview: number;
  readonly staleForecasts: number;
  readonly sourceControlTotals: readonly {
    source: string;
    recordType: string;
    count: number;
    amount: number;
    status: "reconciled" | "difference";
  }[];
}

export interface TrailSolutionsSnapshot extends TenantOwnedRecord {
  readonly portfolio: PortfolioSummary;
  readonly projects: readonly ProjectFinancialSummary[];
  readonly benchmarks: readonly Benchmark[];
  readonly decisions: readonly DecisionItem[];
  readonly dataHealth: DataHealthSummary;
}
