ALTER TYPE "public"."audit_action" ADD VALUE 'manual_create';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'forecast_update';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'match_activity';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'estimate_saved';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'estimate_deleted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'project_from_estimate';--> statement-breakpoint
CREATE TABLE "job_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"business_line" text NOT NULL,
	"input" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"benchmark_version" text,
	"linked_project_code" text,
	"created_by" text NOT NULL,
	"created_by_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_estimates" ADD CONSTRAINT "job_estimates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;