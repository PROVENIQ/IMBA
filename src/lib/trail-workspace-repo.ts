import { and, asc, eq, isNull } from "drizzle-orm";

import { asImportVersionId, asTestWorkspaceId } from "@/core/primitives/identity";
import type {
  ImportMappingPlanEntry,
  ImportMappingTemplate,
  ImportWorkspaceMode,
  TrailSolutionsTestWorkspace,
  ValidatedImportPackage,
} from "@/core/trail-solutions/import-lab";
import { buildVersionRecord, mergeValidatedPackages } from "@/core/trail-solutions/workspace-transforms";
import type { ImbaRoleKey } from "@/lib/imba-intelligence-data";
import { getDb, type Db } from "@/lib/db/client";
import {
  auditEvents,
  organizations,
  trailImportVersions,
  trailMappingTemplates,
  trailWorkspaces,
} from "@/lib/db/schema";

// The single seeded tenant for now. Multi-tenant schema, one organization in use;
// all current users map here until Clerk Organizations are wired up. Seeded with
// this exact id by scripts/db-seed.ts.
export const IMBA_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";

export class DbNotConfiguredError extends Error {
  constructor() {
    super("The database is not configured. Set DATABASE_URL to enable persistence.");
    this.name = "DbNotConfiguredError";
  }
}

export interface RepoActor {
  readonly organizationId: string;
  readonly userId: string;
  readonly label: string;
  readonly role: ImbaRoleKey;
}

export function canWriteTrailData(role: ImbaRoleKey): boolean {
  return role === "finance" || role === "executive";
}

// Destructive lifecycle actions (reset test data, promote to production) are
// reserved for the CEO/executive role.
export function canAdministerTrailData(role: ImbaRoleKey): boolean {
  return role === "executive";
}

function requireDb(): Db {
  const db = getDb();
  if (!db) throw new DbNotConfiguredError();
  return db;
}

type WorkspaceRow = typeof trailWorkspaces.$inferSelect;
type VersionRow = typeof trailImportVersions.$inferSelect;

function toWorkspace(row: WorkspaceRow, versions: readonly VersionRow[]): TrailSolutionsTestWorkspace {
  const active = versions.find((version) => version.id === row.activeVersionId) ?? versions.at(-1);
  if (!active) throw new TypeError(`Workspace ${row.id} has no import versions.`);
  return Object.freeze({
    workspaceId: asTestWorkspaceId(row.id),
    organizationId: active.validatedPackage.snapshot.organizationId,
    name: row.name,
    description: row.description,
    environment: row.environment,
    firstImportedAt: versions[0]?.record.recordedAt ?? row.createdAt.toISOString(),
    lastImportedAt: active.record.recordedAt,
    importedBy: active.record.importedBy,
    mappingTemplateName: row.mappingTemplateName ?? undefined,
    projectCount: row.projectCount,
    dataQualityStatus: row.dataQualityStatus,
    archived: row.archived,
    activeVersionId: asImportVersionId(active.id),
    versions: versions.map((version) => version.record),
    sourceFiles: active.sourceFiles,
    validatedPackage: active.validatedPackage,
  });
}

async function loadVersions(db: Db, orgId: string, workspaceId: string): Promise<VersionRow[]> {
  return db
    .select()
    .from(trailImportVersions)
    .where(and(eq(trailImportVersions.organizationId, orgId), eq(trailImportVersions.workspaceId, workspaceId)))
    .orderBy(asc(trailImportVersions.createdAt));
}

export async function listWorkspaces(orgId: string): Promise<TrailSolutionsTestWorkspace[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(trailWorkspaces)
    .where(and(eq(trailWorkspaces.organizationId, orgId), isNull(trailWorkspaces.deletedAt)))
    .orderBy(asc(trailWorkspaces.createdAt));
  const result: TrailSolutionsTestWorkspace[] = [];
  for (const row of rows) {
    const versions = await loadVersions(db, orgId, row.id);
    if (versions.length) result.push(toWorkspace(row, versions));
  }
  return result;
}

export async function getWorkspace(orgId: string, workspaceId: string): Promise<TrailSolutionsTestWorkspace | null> {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(trailWorkspaces)
    .where(and(eq(trailWorkspaces.id, workspaceId), eq(trailWorkspaces.organizationId, orgId), isNull(trailWorkspaces.deletedAt)))
    .limit(1);
  if (!row) return null;
  const versions = await loadVersions(db, orgId, workspaceId);
  return versions.length ? toWorkspace(row, versions) : null;
}

async function writeAudit(
  executor: Db,
  actor: RepoActor,
  input: {
    action: typeof auditEvents.$inferInsert.action;
    entityType: string;
    entityId?: string | null;
    workspaceName?: string | null;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  await executor.insert(auditEvents).values({
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    actorLabel: actor.label,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    workspaceName: input.workspaceName ?? null,
    detail: input.detail ?? null,
  });
}

export async function commitWorkspace(input: {
  actor: RepoActor;
  mode: ImportWorkspaceMode;
  workspaceId?: string;
  name: string;
  description: string;
  validatedPackage: ValidatedImportPackage;
  mappingTemplateName?: string;
  mappingChangeCount: number;
}): Promise<TrailSolutionsTestWorkspace> {
  if (input.validatedPackage.readiness === "blocked") throw new TypeError("Blocked imports cannot be committed.");
  const db = requireDb();
  const { actor } = input;

  const committedId = await db.transaction(async (tx) => {
    // Idempotently ensure the tenant row exists (self-seeds IMBA on first write),
    // so provisioning is just "add Neon + run migrations" with no seed step.
    await tx.insert(organizations).values({ id: actor.organizationId, name: "IMBA" }).onConflictDoNothing();

    let workspaceId = input.workspaceId;
    let packageToStore = input.validatedPackage;
    let previousVersionId: string | null = null;

    if (input.mode === "create") {
      const [created] = await tx
        .insert(trailWorkspaces)
        .values({
          organizationId: actor.organizationId,
          name: input.name.trim(),
          description: input.description.trim(),
          environment: "uploaded-test",
          dataClass: "test",
          projectCount: input.validatedPackage.snapshot.projects.length,
          dataQualityStatus: input.validatedPackage.readiness,
          mappingTemplateName: input.mappingTemplateName ?? null,
          createdBy: actor.userId,
          createdByLabel: actor.label,
        })
        .returning({ id: trailWorkspaces.id });
      workspaceId = created.id;
    } else {
      if (!workspaceId) throw new TypeError("Select an existing test workspace.");
      const [existing] = await tx
        .select()
        .from(trailWorkspaces)
        .where(and(eq(trailWorkspaces.id, workspaceId), eq(trailWorkspaces.organizationId, actor.organizationId), isNull(trailWorkspaces.deletedAt)))
        .limit(1);
      if (!existing) throw new TypeError("Workspace not found.");
      previousVersionId = existing.activeVersionId;
      if (input.mode === "add" && existing.activeVersionId) {
        const [activeVersion] = await tx
          .select()
          .from(trailImportVersions)
          .where(eq(trailImportVersions.id, existing.activeVersionId))
          .limit(1);
        if (activeVersion) packageToStore = mergeValidatedPackages(activeVersion.validatedPackage, input.validatedPackage);
      }
    }

    const record = buildVersionRecord({
      package: packageToStore,
      mode: input.mode,
      previousVersionId: previousVersionId ? asImportVersionId(previousVersionId) : undefined,
      importedBy: actor.label,
      mappingTemplateName: input.mappingTemplateName,
      mappingChangeCount: input.mappingChangeCount,
    });

    await tx.insert(trailImportVersions).values({
      id: packageToStore.versionId,
      workspaceId: workspaceId!,
      organizationId: actor.organizationId,
      previousVersionId,
      mode: input.mode,
      importedBy: actor.userId,
      importedByLabel: actor.label,
      recordsAccepted: record.recordsAccepted,
      recordsRejected: record.recordsRejected,
      warningCount: record.warningCount,
      reconciliationDifferenceCount: record.reconciliationDifferenceCount,
      mappingChangeCount: record.mappingChangeCount,
      sourceFiles: packageToStore.files,
      validatedPackage: packageToStore,
      record,
    });

    await tx
      .update(trailWorkspaces)
      .set({
        activeVersionId: packageToStore.versionId,
        projectCount: packageToStore.snapshot.projects.length,
        dataQualityStatus: packageToStore.readiness,
        name: input.name.trim(),
        description: input.description.trim(),
        mappingTemplateName: input.mappingTemplateName ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(trailWorkspaces.id, workspaceId!), eq(trailWorkspaces.organizationId, actor.organizationId)));

    await writeAudit(tx, actor, {
      action: input.mode === "create" ? "commit" : input.mode,
      entityType: "trail_workspace",
      entityId: workspaceId,
      workspaceName: input.name.trim(),
      detail: {
        recordsAccepted: record.recordsAccepted,
        recordsRejected: record.recordsRejected,
        reconciliationDifferences: record.reconciliationDifferenceCount,
      },
    });

    return workspaceId!;
  });

  const workspace = await getWorkspace(actor.organizationId, committedId);
  if (!workspace) throw new TypeError("Commit succeeded but the workspace could not be reloaded.");
  return workspace;
}

export async function renameWorkspace(actor: RepoActor, workspaceId: string, name: string): Promise<void> {
  const db = requireDb();
  const trimmed = name.trim();
  if (!trimmed) throw new TypeError("A workspace name is required.");
  const [row] = await db
    .update(trailWorkspaces)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(and(eq(trailWorkspaces.id, workspaceId), eq(trailWorkspaces.organizationId, actor.organizationId), isNull(trailWorkspaces.deletedAt)))
    .returning({ name: trailWorkspaces.name });
  if (!row) throw new TypeError("Workspace not found.");
}

export async function archiveWorkspace(actor: RepoActor, workspaceId: string, archived: boolean): Promise<void> {
  const db = requireDb();
  const [row] = await db
    .update(trailWorkspaces)
    .set({ archived, updatedAt: new Date() })
    .where(and(eq(trailWorkspaces.id, workspaceId), eq(trailWorkspaces.organizationId, actor.organizationId), isNull(trailWorkspaces.deletedAt)))
    .returning({ name: trailWorkspaces.name });
  if (!row) throw new TypeError("Workspace not found.");
  await writeAudit(db, actor, { action: archived ? "archive" : "restore", entityType: "trail_workspace", entityId: workspaceId, workspaceName: row.name });
}

export async function softDeleteWorkspace(actor: RepoActor, workspaceId: string): Promise<void> {
  const db = requireDb();
  const [row] = await db
    .update(trailWorkspaces)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(trailWorkspaces.id, workspaceId), eq(trailWorkspaces.organizationId, actor.organizationId), isNull(trailWorkspaces.deletedAt)))
    .returning({ name: trailWorkspaces.name });
  if (!row) throw new TypeError("Workspace not found.");
  await writeAudit(db, actor, { action: "delete", entityType: "trail_workspace", entityId: workspaceId, workspaceName: row.name });
}

export async function promoteToProduction(actor: RepoActor, workspaceId: string): Promise<void> {
  const db = requireDb();
  const [row] = await db
    .update(trailWorkspaces)
    .set({ dataClass: "production", environment: "validated-production-derived", updatedAt: new Date() })
    .where(and(eq(trailWorkspaces.id, workspaceId), eq(trailWorkspaces.organizationId, actor.organizationId), isNull(trailWorkspaces.deletedAt)))
    .returning({ name: trailWorkspaces.name });
  if (!row) throw new TypeError("Workspace not found.");
  await writeAudit(db, actor, { action: "promote", entityType: "trail_workspace", entityId: workspaceId, workspaceName: row.name });
}

// Admin-only. Soft-deletes every test-class workspace for the org; never touches
// production-classified data.
export async function resetTestData(actor: RepoActor): Promise<number> {
  const db = requireDb();
  const rows = await db
    .update(trailWorkspaces)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(trailWorkspaces.organizationId, actor.organizationId), eq(trailWorkspaces.dataClass, "test"), isNull(trailWorkspaces.deletedAt)))
    .returning({ id: trailWorkspaces.id });
  await writeAudit(db, actor, { action: "reset", entityType: "trail_workspace", detail: { clearedCount: rows.length } });
  return rows.length;
}

export async function listMappingTemplates(orgId: string): Promise<ImportMappingTemplate[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(trailMappingTemplates)
    .where(eq(trailMappingTemplates.organizationId, orgId))
    .orderBy(asc(trailMappingTemplates.createdAt));
  return rows.map((row) =>
    Object.freeze({
      mappingTemplateId: row.id as ImportMappingTemplate["mappingTemplateId"],
      name: row.name,
      sourceLabel: row.sourceLabel,
      savedAt: row.createdAt.toISOString(),
      mappings: row.mappings,
    }),
  );
}

export async function saveMappingTemplate(
  actor: RepoActor,
  input: { name: string; sourceLabel: string; mappings: readonly ImportMappingPlanEntry[] },
): Promise<ImportMappingTemplate> {
  const db = requireDb();
  const name = input.name.trim();
  // Replace any same-name template for this org (case-insensitive match handled by delete-then-insert on trimmed name).
  const existing = await db
    .select({ id: trailMappingTemplates.id, name: trailMappingTemplates.name })
    .from(trailMappingTemplates)
    .where(eq(trailMappingTemplates.organizationId, actor.organizationId));
  for (const template of existing) {
    if (template.name.toLowerCase() === name.toLowerCase()) {
      await db.delete(trailMappingTemplates).where(eq(trailMappingTemplates.id, template.id));
    }
  }
  const [row] = await db
    .insert(trailMappingTemplates)
    .values({ organizationId: actor.organizationId, name, sourceLabel: input.sourceLabel, mappings: input.mappings, createdBy: actor.userId })
    .returning();
  return Object.freeze({
    mappingTemplateId: row.id as ImportMappingTemplate["mappingTemplateId"],
    name: row.name,
    sourceLabel: row.sourceLabel,
    savedAt: row.createdAt.toISOString(),
    mappings: row.mappings,
  });
}
