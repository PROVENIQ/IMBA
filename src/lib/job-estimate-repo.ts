import { and, desc, eq } from "drizzle-orm";

import type { EstimateDriverInput, EstimateResult } from "@/core/trail-solutions/estimator";
import { getDb, type Db } from "@/lib/db/client";
import { auditEvents, jobEstimates, organizations } from "@/lib/db/schema";
import { DbNotConfiguredError, type RepoActor } from "@/lib/trail-workspace-repo";

// Persistence for saved job-cost estimates. A saved estimate is a benchmark-grounded
// planning artifact (explicitly NOT an approved quote), org-scoped and audited,
// mirroring the trail-workspace repository patterns.

export interface SavedEstimate {
  readonly id: string;
  readonly name: string;
  readonly businessLine: string;
  readonly input: EstimateDriverInput;
  readonly result: EstimateResult;
  readonly benchmarkVersion?: string;
  readonly linkedProjectCode?: string;
  readonly createdBy: string;
  readonly createdByLabel?: string;
  readonly createdAt: string;
}

function requireDb(): Db {
  const db = getDb();
  if (!db) throw new DbNotConfiguredError();
  return db;
}

type EstimateRow = typeof jobEstimates.$inferSelect;

function toSavedEstimate(row: EstimateRow): SavedEstimate {
  return Object.freeze({
    id: row.id,
    name: row.name,
    businessLine: row.businessLine,
    input: row.input,
    result: row.result,
    benchmarkVersion: row.benchmarkVersion ?? undefined,
    linkedProjectCode: row.linkedProjectCode ?? undefined,
    createdBy: row.createdBy,
    createdByLabel: row.createdByLabel ?? undefined,
    createdAt: row.createdAt.toISOString(),
  });
}

export async function listEstimates(orgId: string): Promise<SavedEstimate[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(jobEstimates)
    .where(eq(jobEstimates.organizationId, orgId))
    .orderBy(desc(jobEstimates.createdAt));
  return rows.map(toSavedEstimate);
}

export async function saveEstimate(
  actor: RepoActor,
  input: {
    name: string;
    businessLine: string;
    input: EstimateDriverInput;
    result: EstimateResult;
    benchmarkVersion?: string;
    linkedProjectCode?: string;
  },
): Promise<SavedEstimate> {
  const db = requireDb();
  const name = input.name.trim();
  if (!name) throw new TypeError("An estimate name is required.");

  const saved = await db.transaction(async (tx) => {
    // Idempotently ensure the tenant row exists (self-seeds IMBA on first write).
    await tx.insert(organizations).values({ id: actor.organizationId, name: "IMBA" }).onConflictDoNothing();

    const [row] = await tx
      .insert(jobEstimates)
      .values({
        organizationId: actor.organizationId,
        name,
        businessLine: input.businessLine,
        input: input.input,
        result: input.result,
        benchmarkVersion: input.benchmarkVersion ?? null,
        linkedProjectCode: input.linkedProjectCode ?? null,
        createdBy: actor.userId,
        createdByLabel: actor.label,
      })
      .returning();

    await tx.insert(auditEvents).values({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "estimate_saved",
      entityType: "job_estimate",
      entityId: row.id,
      workspaceName: name,
      detail: { businessLine: input.businessLine, linkedProjectCode: input.linkedProjectCode ?? null },
    });

    return row;
  });

  return toSavedEstimate(saved);
}

export async function deleteEstimate(actor: RepoActor, estimateId: string): Promise<void> {
  const db = requireDb();
  const [row] = await db
    .delete(jobEstimates)
    .where(and(eq(jobEstimates.id, estimateId), eq(jobEstimates.organizationId, actor.organizationId)))
    .returning({ id: jobEstimates.id, name: jobEstimates.name });
  if (!row) throw new TypeError("Estimate not found.");
  await db.insert(auditEvents).values({
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    actorLabel: actor.label,
    action: "estimate_deleted",
    entityType: "job_estimate",
    entityId: row.id,
    workspaceName: row.name,
    detail: null,
  });
}
