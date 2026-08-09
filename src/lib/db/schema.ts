import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  ImportFileDescriptor,
  ImportMappingPlanEntry,
  ImportVersionRecord,
  ValidatedImportPackage,
} from "@/core/trail-solutions/import-lab";
import type { EstimateDriverInput, EstimateResult } from "@/core/trail-solutions/estimator";

// Trail Solutions persistence. Every row is scoped to an organization (multi-tenant
// from day one; IMBA is the first org). Large computed bundles (the validated import
// package: snapshot, project details, normalized dataset) are stored as JSONB — they
// are computed outputs, not relationally queried.

export const workspaceEnvironment = pgEnum("workspace_environment", [
  "uploaded-test",
  "validated-production-derived",
]);

// synthetic demo data never reaches the DB; the DB only holds test | production.
export const dataClass = pgEnum("data_class", ["test", "production"]);

export const importMode = pgEnum("import_mode", ["create", "replace", "add"]);

export const importReadiness = pgEnum("import_readiness", ["ready", "warnings", "blocked"]);

export const auditAction = pgEnum("audit_action", [
  "upload",
  "commit",
  "replace",
  "add",
  "delete",
  "archive",
  "restore",
  "reset",
  "promote",
  // Manual create/edit workflow events (§15). These flow through the same
  // commitWorkspace write path as imports, but record the precise entity action.
  "manual_create",
  "forecast_update",
  "match_activity",
  "change_order_added",
  "operational_driver_added",
  "funding_updated",
  "decision_action_added",
  "estimate_saved",
  "estimate_deleted",
  "project_from_estimate",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trailWorkspaces = pgTable("trail_workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  environment: workspaceEnvironment("environment").notNull().default("uploaded-test"),
  dataClass: dataClass("data_class").notNull().default("test"),
  activeVersionId: uuid("active_version_id"),
  projectCount: integer("project_count").notNull().default(0),
  dataQualityStatus: importReadiness("data_quality_status").notNull().default("ready"),
  mappingTemplateName: text("mapping_template_name"),
  archived: boolean("archived").notNull().default(false),
  createdBy: text("created_by").notNull(),
  createdByLabel: text("created_by_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const trailImportVersions = pgTable("trail_import_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => trailWorkspaces.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  previousVersionId: uuid("previous_version_id"),
  mode: importMode("mode").notNull(),
  importedBy: text("imported_by").notNull(),
  importedByLabel: text("imported_by_label"),
  recordsAccepted: integer("records_accepted").notNull().default(0),
  recordsRejected: integer("records_rejected").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  reconciliationDifferenceCount: integer("reconciliation_difference_count").notNull().default(0),
  mappingChangeCount: integer("mapping_change_count").notNull().default(0),
  sourceFiles: jsonb("source_files").$type<readonly ImportFileDescriptor[]>().notNull(),
  validatedPackage: jsonb("validated_package").$type<ValidatedImportPackage>().notNull(),
  record: jsonb("record").$type<ImportVersionRecord>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trailMappingTemplates = pgTable("trail_mapping_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  sourceLabel: text("source_label").notNull(),
  mappings: jsonb("mappings").$type<readonly ImportMappingPlanEntry[]>().notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Saved job-cost estimates. A benchmark-grounded planning artifact — explicitly NOT
// an approved quote — so it lives in its own table rather than the project snapshot.
// linkedProjectCode optionally ties a saved estimate to a project once one exists.
export const jobEstimates = pgTable("job_estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  businessLine: text("business_line").notNull(),
  input: jsonb("input").$type<EstimateDriverInput>().notNull(),
  result: jsonb("result").$type<EstimateResult>().notNull(),
  benchmarkVersion: text("benchmark_version"),
  linkedProjectCode: text("linked_project_code"),
  createdBy: text("created_by").notNull(),
  createdByLabel: text("created_by_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  actorUserId: text("actor_user_id").notNull(),
  actorLabel: text("actor_label"),
  action: auditAction("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  workspaceName: text("workspace_name"),
  detail: jsonb("detail").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
