CREATE TYPE "public"."audit_action" AS ENUM('upload', 'commit', 'replace', 'add', 'delete', 'archive', 'restore', 'reset', 'promote');--> statement-breakpoint
CREATE TYPE "public"."data_class" AS ENUM('test', 'production');--> statement-breakpoint
CREATE TYPE "public"."import_mode" AS ENUM('create', 'replace', 'add');--> statement-breakpoint
CREATE TYPE "public"."import_readiness" AS ENUM('ready', 'warnings', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."workspace_environment" AS ENUM('uploaded-test', 'validated-production-derived');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"actor_label" text,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"workspace_name" text,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trail_import_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"previous_version_id" uuid,
	"mode" "import_mode" NOT NULL,
	"imported_by" text NOT NULL,
	"imported_by_label" text,
	"records_accepted" integer DEFAULT 0 NOT NULL,
	"records_rejected" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"reconciliation_difference_count" integer DEFAULT 0 NOT NULL,
	"mapping_change_count" integer DEFAULT 0 NOT NULL,
	"source_files" jsonb NOT NULL,
	"validated_package" jsonb NOT NULL,
	"record" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trail_mapping_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"source_label" text NOT NULL,
	"mappings" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trail_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"environment" "workspace_environment" DEFAULT 'uploaded-test' NOT NULL,
	"data_class" "data_class" DEFAULT 'test' NOT NULL,
	"active_version_id" uuid,
	"project_count" integer DEFAULT 0 NOT NULL,
	"data_quality_status" "import_readiness" DEFAULT 'ready' NOT NULL,
	"mapping_template_name" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_by_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_import_versions" ADD CONSTRAINT "trail_import_versions_workspace_id_trail_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."trail_workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_import_versions" ADD CONSTRAINT "trail_import_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_mapping_templates" ADD CONSTRAINT "trail_mapping_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_workspaces" ADD CONSTRAINT "trail_workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;