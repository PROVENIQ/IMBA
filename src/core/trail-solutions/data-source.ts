import type { OrganizationId, ProjectId } from "@/core/primitives/identity";
import type {
  Benchmark,
  BenchmarkFilters,
  ChangeOrder,
  CostCodeMapping,
  DataException,
  DataHealthSummary,
  DataRefreshStatus,
  DecisionItem,
  EstimateLine,
  EstimateVersion,
  GrantFundingRecord,
  LaborActual,
  LaborRate,
  NonlaborActual,
  OperationalDriver,
  PortfolioSummary,
  Project,
  ProjectDetail,
  ProjectFilters,
  ProjectFinancialSummary,
  ProjectIdentifierCrosswalk,
  RevenueBillingRecord,
  TrailSolutionsSnapshot,
} from "@/core/trail-solutions/model";

export interface TrailSolutionsDataContext {
  readonly organizationId: OrganizationId;
  readonly chapterScope: "NATIONAL";
}

export interface TrailSolutionsDataSource {
  getPortfolioSummary(context: TrailSolutionsDataContext): Promise<PortfolioSummary>;
  getProjects(
    context: TrailSolutionsDataContext,
    filters?: ProjectFilters,
  ): Promise<readonly ProjectFinancialSummary[]>;
  getProject(context: TrailSolutionsDataContext, projectId: ProjectId): Promise<ProjectDetail>;
  getBenchmarks(
    context: TrailSolutionsDataContext,
    filters?: BenchmarkFilters,
  ): Promise<readonly Benchmark[]>;
  getExceptions(context: TrailSolutionsDataContext): Promise<readonly DataException[]>;
  getDecisionItems(context: TrailSolutionsDataContext): Promise<readonly DecisionItem[]>;
  getDataHealth(context: TrailSolutionsDataContext): Promise<DataHealthSummary>;
  getSnapshot(context: TrailSolutionsDataContext): Promise<TrailSolutionsSnapshot>;
}

export interface WorkbookDerivedSnapshot {
  readonly sourceName: string;
  readonly workbookTemplate: string;
  readonly transformVersion: number;
  readonly sourceAsOfDate: string;
  readonly organizationId: string;
  readonly chapterScope: "NATIONAL";
  readonly projects: readonly Project[];
  readonly projectCrosswalks: readonly ProjectIdentifierCrosswalk[];
  readonly estimateVersions: readonly EstimateVersion[];
  readonly estimateLines: readonly EstimateLine[];
  readonly laborActuals: readonly LaborActual[];
  readonly nonlaborActuals: readonly NonlaborActual[];
  readonly revenueBillingRecords: readonly RevenueBillingRecord[];
  readonly changeOrders: readonly ChangeOrder[];
  readonly operationalDrivers: readonly OperationalDriver[];
  readonly grantFundingRecords: readonly GrantFundingRecord[];
  readonly laborRates: readonly LaborRate[];
  readonly costCodeMappings: readonly CostCodeMapping[];
  readonly dataExceptions: readonly DataException[];
  readonly benchmarks: readonly Benchmark[];
  readonly decisionItems: readonly DecisionItem[];
  readonly refreshStatuses: readonly DataRefreshStatus[];
}
