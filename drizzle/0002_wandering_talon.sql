ALTER TYPE "public"."audit_action" ADD VALUE 'change_order_added' BEFORE 'estimate_saved';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'operational_driver_added' BEFORE 'estimate_saved';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'funding_updated' BEFORE 'estimate_saved';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'decision_action_added' BEFORE 'estimate_saved';