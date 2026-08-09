import type { DataHealthSummary, FinancialHealthStatus, PortfolioSummary, ProjectDetail, TrailSolutionsSnapshot } from "@/core/trail-solutions/model";
import { calculateGrantAgreementControls, forecastIsStale, isCrossProjectLabor } from "@/core/trail-solutions/funding-controls";
import type {
  ImportReadiness,
  ImportVersionRecord,
  ImportWorkspaceMode,
  ValidatedImportPackage,
} from "@/core/trail-solutions/import-lab";

// Pure domain transforms for Trail Solutions workspaces. These are storage-agnostic
// (no localStorage, no DB) so both the browser client and the server repository can
// reuse the exact same merge / recompute / version-record logic.

export function combinedReadiness(left: ImportReadiness, right: ImportReadiness): ImportReadiness {
  if (left === "blocked" || right === "blocked") return "blocked";
  if (left === "warnings" || right === "warnings") return "warnings";
  return "ready";
}

interface DetailMetrics {
  readonly outstandingReimbursement: number;
  readonly awardCashExposure: number;
  readonly remainingMatchRequirement: number;
  readonly staleForecasts: number;
  readonly crossProjectLaborRecordsRequiringReview: number;
  readonly pendingMatchEligibilityReviews: number;
}

function detailMetrics(snapshot: TrailSolutionsSnapshot, projectDetails: Readonly<Record<string, ProjectDetail>>): DetailMetrics {
  const details = snapshot.projects.map((project) => projectDetails[project.projectId]).filter((detail): detail is ProjectDetail => Boolean(detail));
  const asOfDate = snapshot.portfolio.lastDataRefresh;
  const controls = details.flatMap((detail) => detail.grantFunding.map((grant) => calculateGrantAgreementControls({
    grant,
    laborActuals: detail.laborActuals,
    nonlaborActuals: detail.nonlaborActuals,
    matchActivities: detail.matchActivities ?? [],
  })));
  const forecasts = details.flatMap((detail) => detail.forecastUpdates ?? []);
  const labor = details.flatMap((detail) => detail.laborActuals);
  const matches = details.flatMap((detail) => detail.matchActivities ?? []);
  return {
    outstandingReimbursement: controls.reduce((total, control) => total + control.outstandingReimbursement, 0),
    awardCashExposure: controls.reduce((total, control) => total + control.awardCashExposure, 0),
    remainingMatchRequirement: controls.reduce((total, control) => total + control.remainingMatchRequirement, 0),
    staleForecasts: forecasts.filter((forecast) => forecast.status === "Stale" || forecastIsStale(forecast.forecastDate, asOfDate)).length,
    crossProjectLaborRecordsRequiringReview: labor.filter(isCrossProjectLabor).length,
    pendingMatchEligibilityReviews: matches.filter((match) => match.eligibilityStatus === "Pending").length,
  };
}

export function portfolioFromSnapshotProjects(
  snapshot: TrailSolutionsSnapshot,
  projectDetails: Readonly<Record<string, ProjectDetail>> = {},
): PortfolioSummary {
  const projects = snapshot.projects;
  const reliable = projects.filter((project) => project.forecastFinalCost !== null && project.forecastMargin !== null);
  const totalCurrentContractValue = projects.reduce((total, project) => total + project.currentContractValue, 0);
  const reliableContract = reliable.reduce((total, project) => total + project.currentContractValue, 0);
  const forecastGrossMargin = reliable.reduce((total, project) => total + (project.forecastMargin ?? 0), 0);
  const healthCounts: Record<FinancialHealthStatus, number> = { "on-track": 0, watch: 0, "at-risk": 0, "data-incomplete": 0 };
  projects.forEach((project) => { healthCounts[project.healthStatus] += 1; });
  const metrics = detailMetrics(snapshot, projectDetails);
  return Object.freeze({
    organizationId: snapshot.organizationId,
    chapterScope: "NATIONAL",
    activeProjects: projects.filter((project) => project.projectStage !== "Completed").length,
    totalCurrentContractValue,
    actualCostToDate: projects.reduce((total, project) => total + project.actualCostToDate, 0),
    forecastFinalCost: reliable.reduce((total, project) => total + (project.forecastFinalCost ?? 0), 0),
    forecastGrossMargin,
    forecastGrossMarginPercent: reliableContract > 0 ? forecastGrossMargin / reliableContract : null,
    forecastCoverageProjects: reliable.length,
    outstandingReceivables: projects.reduce((total, project) => total + project.outstandingReceivables, 0),
    unbilledAmount: projects.reduce((total, project) => total + (project.unbilledAmount ?? 0), 0),
    projectsRequiringDecisions: projects.filter((project) => project.decisionsRequired.length > 0).length,
    projectsWithDataExceptions: projects.filter((project) => project.unresolvedExceptionCount > 0).length,
    healthCounts,
    lastDataRefresh: projects.map((project) => project.lastDataRefresh).sort().at(-1) ?? snapshot.portfolio.lastDataRefresh,
    ...metrics,
  });
}

export function applyDetailMetricsToDataHealth(
  dataHealth: DataHealthSummary,
  snapshot: TrailSolutionsSnapshot,
  projectDetails: Readonly<Record<string, ProjectDetail>>,
): DataHealthSummary {
  const metrics = detailMetrics(snapshot, projectDetails);
  return Object.freeze({
    ...dataHealth,
    staleForecasts: metrics.staleForecasts,
    crossProjectLaborRecordsRequiringReview: metrics.crossProjectLaborRecordsRequiringReview,
    pendingMatchEligibilityReviews: metrics.pendingMatchEligibilityReviews,
  });
}

export function mergeValidatedPackages(
  current: ValidatedImportPackage,
  incoming: ValidatedImportPackage,
): ValidatedImportPackage {
  if (current.snapshot.organizationId !== incoming.snapshot.organizationId) {
    throw new TypeError("Cannot merge packages from different organizations.");
  }
  const projectCodes = new Set(current.snapshot.projects.map((project) => project.projectCode));
  const duplicate = incoming.snapshot.projects.find((project) => projectCodes.has(project.projectCode));
  if (duplicate) throw new TypeError(`Add mode cannot merge duplicate Project ID ${duplicate.projectCode}; use Replace instead.`);
  const projects = [...current.snapshot.projects, ...incoming.snapshot.projects];
  const decisions = [...current.snapshot.decisions, ...incoming.snapshot.decisions];
  const exceptions = [...current.snapshot.dataHealth.exceptions, ...incoming.snapshot.dataHealth.exceptions];
  const sourceControlTotals = [...current.snapshot.dataHealth.sourceControlTotals, ...incoming.snapshot.dataHealth.sourceControlTotals];
  const snapshotBase: TrailSolutionsSnapshot = Object.freeze({
    organizationId: current.snapshot.organizationId,
    chapterScope: "NATIONAL",
    portfolio: current.snapshot.portfolio,
    projects,
    benchmarks: [...current.snapshot.benchmarks, ...incoming.snapshot.benchmarks],
    decisions,
    dataHealth: Object.freeze({
      ...current.snapshot.dataHealth,
      exceptions,
      refreshStatuses: [...current.snapshot.dataHealth.refreshStatuses, ...incoming.snapshot.dataHealth.refreshStatuses],
      unmappedProjectIdentifiers: current.snapshot.dataHealth.unmappedProjectIdentifiers + incoming.snapshot.dataHealth.unmappedProjectIdentifiers,
      unmappedCostCodes: current.snapshot.dataHealth.unmappedCostCodes + incoming.snapshot.dataHealth.unmappedCostCodes,
      transactionsMissingProjectIds: current.snapshot.dataHealth.transactionsMissingProjectIds + incoming.snapshot.dataHealth.transactionsMissingProjectIds,
      laborRecordsMissingHours: current.snapshot.dataHealth.laborRecordsMissingHours + incoming.snapshot.dataHealth.laborRecordsMissingHours,
      costsMissingOperationalQuantity: current.snapshot.dataHealth.costsMissingOperationalQuantity + incoming.snapshot.dataHealth.costsMissingOperationalQuantity,
      projectsWithoutCurrentEstimate: current.snapshot.dataHealth.projectsWithoutCurrentEstimate + incoming.snapshot.dataHealth.projectsWithoutCurrentEstimate,
      projectsWithoutEstimateToComplete: current.snapshot.dataHealth.projectsWithoutEstimateToComplete + incoming.snapshot.dataHealth.projectsWithoutEstimateToComplete,
      billingReconciliationIssues: current.snapshot.dataHealth.billingReconciliationIssues + incoming.snapshot.dataHealth.billingReconciliationIssues,
      fundingClassificationsRequiringReview: current.snapshot.dataHealth.fundingClassificationsRequiringReview + incoming.snapshot.dataHealth.fundingClassificationsRequiringReview,
      staleForecasts: current.snapshot.dataHealth.staleForecasts + incoming.snapshot.dataHealth.staleForecasts,
      sourceControlTotals,
    }),
  });
  const projectDetails = Object.freeze({ ...current.projectDetails, ...incoming.projectDetails });
  const snapshotWithPortfolio = Object.freeze({ ...snapshotBase, portfolio: portfolioFromSnapshotProjects(snapshotBase, projectDetails) });
  const snapshot = Object.freeze({
    ...snapshotWithPortfolio,
    dataHealth: applyDetailMetricsToDataHealth(snapshotWithPortfolio.dataHealth, snapshotWithPortfolio, projectDetails),
  });
  const normalizedTables = new Set([...Object.keys(current.normalizedDataset.tables), ...Object.keys(incoming.normalizedDataset.tables)]);
  const normalizedDataset = Object.freeze({ tables: Object.freeze(Object.fromEntries([...normalizedTables].map((table) => [table, [...(current.normalizedDataset.tables[table] ?? []), ...(incoming.normalizedDataset.tables[table] ?? [])]]))) });
  const controls = new Map(current.preview.controlTotals.map((control) => [control.label, { ...control }]));
  incoming.preview.controlTotals.forEach((control) => {
    const previous = controls.get(control.label);
    if (!previous) controls.set(control.label, { ...control });
    else {
      previous.sourceValue += control.sourceValue;
      previous.loadValue += control.loadValue;
      previous.difference = previous.loadValue - previous.sourceValue;
      previous.status = Math.abs(previous.difference) <= 0.01 ? "reconciled" : "difference";
    }
  });
  return Object.freeze({
    ...incoming,
    files: [...current.files, ...incoming.files],
    readiness: combinedReadiness(current.readiness, incoming.readiness),
    issues: [...current.issues, ...incoming.issues],
    preview: Object.freeze({
      projectCount: current.preview.projectCount + incoming.preview.projectCount,
      transactionCount: current.preview.transactionCount + incoming.preview.transactionCount,
      totalEstimatedCost: current.preview.totalEstimatedCost === null || incoming.preview.totalEstimatedCost === null ? null : current.preview.totalEstimatedCost + incoming.preview.totalEstimatedCost,
      totalActualCost: current.preview.totalActualCost + incoming.preview.totalActualCost,
      totalContractValue: current.preview.totalContractValue + incoming.preview.totalContractValue,
      laborHours: current.preview.laborHours === null || incoming.preview.laborHours === null ? null : current.preview.laborHours + incoming.preview.laborHours,
      unmappedRecords: current.preview.unmappedRecords + incoming.preview.unmappedRecords,
      warningCount: current.preview.warningCount + incoming.preview.warningCount,
      rejectedRecordCount: current.preview.rejectedRecordCount + incoming.preview.rejectedRecordCount,
      controlTotals: [...controls.values()],
    }),
    analyses: current.analyses.map((analysis) => {
      const other = incoming.analyses.find((candidate) => candidate.analysis === analysis.analysis);
      return other?.available ? other : analysis;
    }),
    snapshot,
    projectDetails,
    normalizedDataset,
  });
}

// Builds the immutable per-import audit record for a version. Actor is the real
// authenticated identity (Clerk userId + label), not a hardcoded prototype string.
export function buildVersionRecord(input: {
  package: ValidatedImportPackage;
  mode: ImportWorkspaceMode;
  previousVersionId?: ImportVersionRecord["versionId"];
  importedBy: string;
  mappingTemplateName?: string;
  mappingChangeCount: number;
}): ImportVersionRecord {
  return Object.freeze({
    attemptId: input.package.attemptId,
    versionId: input.package.versionId,
    previousVersionId: input.previousVersionId,
    mode: input.mode,
    occurredAt: input.package.occurredAt,
    ingestedAt: input.package.ingestedAt,
    recordedAt: input.package.recordedAt,
    importedBy: input.importedBy,
    sourceFiles: input.package.files,
    mappingTemplateName: input.mappingTemplateName,
    mappingChangeCount: input.mappingChangeCount,
    recordsAccepted: input.package.preview.projectCount + input.package.preview.transactionCount,
    recordsRejected: input.package.preview.rejectedRecordCount,
    warningCount: input.package.preview.warningCount,
    reconciliationDifferenceCount: input.package.preview.controlTotals.filter((control) => control.status === "difference").length,
  });
}
