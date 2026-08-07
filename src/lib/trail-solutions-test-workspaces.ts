import {
  asImportVersionId,
  asMappingTemplateId,
  asTestWorkspaceId,
} from "@/core/primitives/identity";
import type { FinancialHealthStatus, PortfolioSummary, TrailSolutionsSnapshot } from "@/core/trail-solutions/model";
import type {
  ImportMappingPlanEntry,
  ImportMappingTemplate,
  ImportReadiness,
  ImportVersionRecord,
  ImportWorkspaceMode,
  TrailSolutionsTestWorkspace,
  ValidatedImportPackage,
} from "@/core/trail-solutions/import-lab";

const WORKSPACE_STORAGE_KEY = "imba-trail-test-workspaces-v1";
const ACTIVE_WORKSPACE_KEY = "imba-trail-active-test-workspace-v1";
const MAPPING_STORAGE_KEY = "imba-trail-import-mappings-v1";

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readArray<T>(key: string): T[] {
  if (!storageAvailable()) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, values: readonly T[]): void {
  if (!storageAvailable()) return;
  window.localStorage.setItem(key, JSON.stringify(values));
}

export function loadTestWorkspaces(): TrailSolutionsTestWorkspace[] {
  return readArray<TrailSolutionsTestWorkspace>(WORKSPACE_STORAGE_KEY);
}

export function persistTestWorkspaces(workspaces: readonly TrailSolutionsTestWorkspace[]): void {
  writeArray(WORKSPACE_STORAGE_KEY, workspaces);
}

export function loadMappingTemplates(): ImportMappingTemplate[] {
  return readArray<ImportMappingTemplate>(MAPPING_STORAGE_KEY);
}

export function saveMappingTemplate(input: {
  name: string;
  sourceLabel: string;
  savedAt: string;
  mappings: readonly ImportMappingPlanEntry[];
}): ImportMappingTemplate {
  const template: ImportMappingTemplate = Object.freeze({
    mappingTemplateId: asMappingTemplateId(crypto.randomUUID()),
    name: input.name.trim(),
    sourceLabel: input.sourceLabel,
    savedAt: input.savedAt,
    mappings: input.mappings,
  });
  const current = loadMappingTemplates().filter((candidate) => candidate.name.toLowerCase() !== template.name.toLowerCase());
  writeArray(MAPPING_STORAGE_KEY, [...current, template]);
  return template;
}

export function getActiveTestWorkspaceId(): string | null {
  return storageAvailable() ? window.localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null;
}

export function setActiveTestWorkspaceId(workspaceId: string | null): void {
  if (!storageAvailable()) return;
  if (workspaceId) window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
  else window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}

function combinedReadiness(left: ImportReadiness, right: ImportReadiness): ImportReadiness {
  if (left === "blocked" || right === "blocked") return "blocked";
  if (left === "warnings" || right === "warnings") return "warnings";
  return "ready";
}

function portfolioFromSnapshotProjects(snapshot: TrailSolutionsSnapshot): PortfolioSummary {
  const projects = snapshot.projects;
  const reliable = projects.filter((project) => project.forecastFinalCost !== null && project.forecastMargin !== null);
  const totalCurrentContractValue = projects.reduce((total, project) => total + project.currentContractValue, 0);
  const reliableContract = reliable.reduce((total, project) => total + project.currentContractValue, 0);
  const forecastGrossMargin = reliable.reduce((total, project) => total + (project.forecastMargin ?? 0), 0);
  const healthCounts: Record<FinancialHealthStatus, number> = { "on-track": 0, watch: 0, "at-risk": 0, "data-incomplete": 0 };
  projects.forEach((project) => { healthCounts[project.healthStatus] += 1; });
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
  });
}

export function mergeValidatedPackages(
  current: ValidatedImportPackage,
  incoming: ValidatedImportPackage,
): ValidatedImportPackage {
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
  const snapshot = Object.freeze({ ...snapshotBase, portfolio: portfolioFromSnapshotProjects(snapshotBase) });
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
    projectDetails: Object.freeze({ ...current.projectDetails, ...incoming.projectDetails }),
    normalizedDataset,
  });
}

function versionRecord(input: {
  package: ValidatedImportPackage;
  mode: ImportWorkspaceMode;
  previousVersionId?: ImportVersionRecord["versionId"];
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
    importedBy: "Finance user (prototype role)",
    sourceFiles: input.package.files,
    mappingTemplateName: input.mappingTemplateName,
    mappingChangeCount: input.mappingChangeCount,
    recordsAccepted: input.package.preview.projectCount + input.package.preview.transactionCount,
    recordsRejected: input.package.preview.rejectedRecordCount,
    warningCount: input.package.preview.warningCount,
    reconciliationDifferenceCount: input.package.preview.controlTotals.filter((control) => control.status === "difference").length,
  });
}

export function commitTestWorkspace(input: {
  workspaces: readonly TrailSolutionsTestWorkspace[];
  mode: ImportWorkspaceMode;
  workspaceId?: string;
  name: string;
  description: string;
  validatedPackage: ValidatedImportPackage;
  mappingTemplateName?: string;
  mappingChangeCount: number;
}): { workspaces: TrailSolutionsTestWorkspace[]; workspace: TrailSolutionsTestWorkspace } {
  if (input.validatedPackage.readiness === "blocked") throw new TypeError("Blocked imports cannot be committed.");
  const current = input.workspaceId ? input.workspaces.find((workspace) => workspace.workspaceId === input.workspaceId) : undefined;
  if (input.mode !== "create" && !current) throw new TypeError("Select an existing test workspace.");
  const packageToCommit = input.mode === "add" && current
    ? mergeValidatedPackages(current.validatedPackage, input.validatedPackage)
    : input.validatedPackage;
  const record = versionRecord({
    package: input.validatedPackage,
    mode: input.mode,
    previousVersionId: current?.activeVersionId,
    mappingTemplateName: input.mappingTemplateName,
    mappingChangeCount: input.mappingChangeCount,
  });
  const workspace: TrailSolutionsTestWorkspace = Object.freeze({
    workspaceId: current?.workspaceId ?? asTestWorkspaceId(crypto.randomUUID()),
    organizationId: packageToCommit.snapshot.organizationId,
    name: input.name.trim(),
    description: input.description.trim(),
    environment: "uploaded-test",
    firstImportedAt: current?.firstImportedAt ?? input.validatedPackage.recordedAt,
    lastImportedAt: input.validatedPackage.recordedAt,
    importedBy: "Finance user (prototype role)",
    mappingTemplateName: input.mappingTemplateName,
    projectCount: packageToCommit.snapshot.projects.length,
    dataQualityStatus: packageToCommit.readiness,
    archived: false,
    activeVersionId: packageToCommit.versionId,
    versions: [...(current?.versions ?? []), record],
    sourceFiles: packageToCommit.files,
    validatedPackage: packageToCommit,
  });
  const workspaces = current
    ? input.workspaces.map((candidate) => candidate.workspaceId === current.workspaceId ? workspace : candidate)
    : [...input.workspaces, workspace];
  return { workspaces: [...workspaces], workspace };
}

export function renameTestWorkspace(workspaces: readonly TrailSolutionsTestWorkspace[], workspaceId: string, name: string): TrailSolutionsTestWorkspace[] {
  return workspaces.map((workspace) => workspace.workspaceId === workspaceId ? Object.freeze({ ...workspace, name: name.trim() }) : workspace);
}

export function setTestWorkspaceArchived(workspaces: readonly TrailSolutionsTestWorkspace[], workspaceId: string, archived: boolean): TrailSolutionsTestWorkspace[] {
  return workspaces.map((workspace) => workspace.workspaceId === workspaceId ? Object.freeze({ ...workspace, archived }) : workspace);
}

export function duplicateTestWorkspace(workspaces: readonly TrailSolutionsTestWorkspace[], workspaceId: string): { workspaces: TrailSolutionsTestWorkspace[]; workspace: TrailSolutionsTestWorkspace } {
  const source = workspaces.find((workspace) => workspace.workspaceId === workspaceId);
  if (!source) throw new TypeError("Workspace not found.");
  const workspace: TrailSolutionsTestWorkspace = Object.freeze({
    ...source,
    workspaceId: asTestWorkspaceId(crypto.randomUUID()),
    name: `${source.name} — Copy`,
    activeVersionId: asImportVersionId(crypto.randomUUID()),
    archived: false,
  });
  return { workspaces: [...workspaces, workspace], workspace };
}

export function deleteTestWorkspace(workspaces: readonly TrailSolutionsTestWorkspace[], workspaceId: string): TrailSolutionsTestWorkspace[] {
  return workspaces.filter((workspace) => workspace.workspaceId !== workspaceId);
}
