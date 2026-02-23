ALTER TABLE "transactions" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "merchant" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "excluded" boolean DEFAULT false NOT NULL;