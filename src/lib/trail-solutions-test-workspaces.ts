import type {
  ImportMappingPlanEntry,
  ImportMappingTemplate,
  ImportWorkspaceMode,
  TrailSolutionsTestWorkspace,
  ValidatedImportPackage,
} from "@/core/trail-solutions/import-lab";
import type { EstimateDriverInput, EstimateResult } from "@/core/trail-solutions/estimator";
import type { SavedEstimate } from "@/lib/job-estimate-repo";

// Client data-access for Trail Solutions workspaces. Uploaded data is persisted
// server-side in Neon (org-scoped, shared) via the /api/trail-solutions routes —
// these are thin fetch wrappers. Only the *active workspace selection* stays
// browser-local, because it's a per-user UI preference, not shared data.

const WORKSPACES_URL = "/api/trail-solutions/workspaces";
const TEMPLATES_URL = "/api/trail-solutions/mapping-templates";
const ESTIMATES_URL = "/api/trail-solutions/estimates";
const ACTIVE_WORKSPACE_KEY = "imba-trail-active-test-workspace-v1";

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "The request could not be completed.");
  }
  return body;
}

export async function fetchTestWorkspaces(): Promise<TrailSolutionsTestWorkspace[]> {
  const response = await fetch(WORKSPACES_URL, { method: "GET", headers: { "Cache-Control": "no-store" } });
  const body = await readJson(response);
  return (body.workspaces ?? []) as TrailSolutionsTestWorkspace[];
}

export async function commitTestWorkspaceRemote(input: {
  mode: ImportWorkspaceMode;
  workspaceId?: string;
  name: string;
  description: string;
  validatedPackage: ValidatedImportPackage;
  mappingTemplateName?: string;
  mappingChangeCount: number;
  audit?: { action: string; entityType: string; entityId?: string | null; detail?: Record<string, unknown> };
}): Promise<TrailSolutionsTestWorkspace> {
  const response = await fetch(WORKSPACES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  return body.workspace as TrailSolutionsTestWorkspace;
}

async function patchWorkspace(workspaceId: string, payload: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${WORKSPACES_URL}/${workspaceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await readJson(response);
}

export async function renameTestWorkspaceRemote(workspaceId: string, name: string): Promise<void> {
  await patchWorkspace(workspaceId, { action: "rename", name });
}

export async function archiveTestWorkspaceRemote(workspaceId: string, archived: boolean): Promise<void> {
  await patchWorkspace(workspaceId, { action: archived ? "archive" : "restore" });
}

export async function promoteTestWorkspaceRemote(workspaceId: string): Promise<void> {
  await patchWorkspace(workspaceId, { action: "promote" });
}

export async function deleteTestWorkspaceRemote(workspaceId: string): Promise<void> {
  const response = await fetch(`${WORKSPACES_URL}/${workspaceId}`, { method: "DELETE" });
  await readJson(response);
}

export async function resetTestDataRemote(): Promise<number> {
  const response = await fetch(`${WORKSPACES_URL}/reset`, { method: "POST" });
  const body = await readJson(response);
  return typeof body.clearedCount === "number" ? body.clearedCount : 0;
}

export async function fetchMappingTemplates(): Promise<ImportMappingTemplate[]> {
  const response = await fetch(TEMPLATES_URL, { method: "GET", headers: { "Cache-Control": "no-store" } });
  const body = await readJson(response);
  return (body.templates ?? []) as ImportMappingTemplate[];
}

export async function saveMappingTemplateRemote(input: {
  name: string;
  sourceLabel: string;
  mappings: readonly ImportMappingPlanEntry[];
}): Promise<ImportMappingTemplate> {
  const response = await fetch(TEMPLATES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  return body.template as ImportMappingTemplate;
}

export async function fetchSavedEstimates(): Promise<SavedEstimate[]> {
  const response = await fetch(ESTIMATES_URL, { method: "GET", headers: { "Cache-Control": "no-store" } });
  const body = await readJson(response);
  return (body.estimates ?? []) as SavedEstimate[];
}

export async function saveEstimateRemote(input: {
  name: string;
  businessLine: string;
  input: EstimateDriverInput;
  result: EstimateResult;
  benchmarkVersion?: string;
  linkedProjectCode?: string;
}): Promise<SavedEstimate> {
  const response = await fetch(ESTIMATES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  return body.estimate as SavedEstimate;
}

export async function deleteSavedEstimateRemote(estimateId: string): Promise<void> {
  const response = await fetch(`${ESTIMATES_URL}/${estimateId}`, { method: "DELETE" });
  await readJson(response);
}

// --- Per-browser UI preference: which workspace is active in the dashboard. ---

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getActiveTestWorkspaceId(): string | null {
  return storageAvailable() ? window.localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null;
}

export function setActiveTestWorkspaceId(workspaceId: string | null): void {
  if (!storageAvailable()) return;
  if (workspaceId) window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
  else window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}
