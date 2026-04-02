ALTER TABLE "users" ADD COLUMN "manifest_requests_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manifest_requests_last_reset" timestamp;