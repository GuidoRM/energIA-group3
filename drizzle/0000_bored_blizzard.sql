CREATE TYPE "public"."alert_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('consumption_spike', 'cost_spike', 'anomaly');--> statement-breakpoint
CREATE TYPE "public"."energy_vector" AS ENUM('gas', 'electricity');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'tool');--> statement-breakpoint
CREATE TYPE "public"."onboarding_stage" AS ENUM('identity', 'equipment', 'operation', 'tariffs', 'complete');--> statement-breakpoint
CREATE TYPE "public"."tdf_location" AS ENUM('ushuaia', 'rio_grande', 'tolhuin');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"location" "tdf_location" DEFAULT 'rio_grande' NOT NULL,
	"gas_tariff" numeric(12, 4),
	"electricity_tariff" numeric(12, 4),
	"onboarding_stage" "onboarding_stage" DEFAULT 'identity' NOT NULL,
	"profile_completion" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gas_tariff_check" CHECK ("company"."gas_tariff" >= 0),
	CONSTRAINT "electricity_tariff_check" CHECK ("company"."electricity_tariff" >= 0),
	CONSTRAINT "profile_completion_check" CHECK ("company"."profile_completion" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"vector" "energy_vector" NOT NULL,
	"power" numeric(12, 3) NOT NULL,
	"hours_per_day" numeric(5, 2) DEFAULT '0' NOT NULL,
	"days_per_month" smallint DEFAULT 0 NOT NULL,
	"process_stage" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "power_check" CHECK ("equipment"."power" > 0),
	CONSTRAINT "hours_per_day_check" CHECK ("equipment"."hours_per_day" BETWEEN 0 AND 24),
	CONSTRAINT "days_per_month_check" CHECK ("equipment"."days_per_month" BETWEEN 0 AND 31)
);
--> statement-breakpoint
CREATE TABLE "model_coefficient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vector" "energy_vector" NOT NULL,
	"sensitivity_per_degree" numeric(8, 5) NOT NULL,
	"reference_temp" numeric(5, 2) NOT NULL,
	"r2" numeric(4, 3),
	"note" text,
	CONSTRAINT "model_coefficient_vector_unique" UNIQUE("vector")
);
--> statement-breakpoint
CREATE TABLE "monthly_climate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location" "tdf_location" NOT NULL,
	"year" smallint NOT NULL,
	"month" smallint NOT NULL,
	"mean_temp" numeric(5, 2) NOT NULL,
	CONSTRAINT "monthly_climate_loc_year_month" UNIQUE("location","year","month"),
	CONSTRAINT "climate_year_check" CHECK ("monthly_climate"."year" BETWEEN 1990 AND 2100),
	CONSTRAINT "climate_month_check" CHECK ("monthly_climate"."month" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE TABLE "projection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"month" smallint NOT NULL,
	"forecast_temp" numeric(5, 2) NOT NULL,
	"estimated_consumption" numeric(16, 2) NOT NULL,
	"estimated_cost" numeric(16, 2) NOT NULL,
	"variation_pct" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projection_year_check" CHECK ("projection"."year" BETWEEN 1990 AND 2100),
	CONSTRAINT "projection_month_check" CHECK ("projection"."month" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE TABLE "alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"projection_id" uuid,
	"type" "alert_type" NOT NULL,
	"severity" "alert_severity" DEFAULT 'medium' NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"title" text,
	"hermes_session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"tool_name" text,
	"tool_args" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projection" ADD CONSTRAINT "projection_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_projection_id_projection_id_fk" FOREIGN KEY ("projection_id") REFERENCES "public"."projection"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_org" ON "app_user" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_company_org" ON "company" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_equipment_company" ON "equipment" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_climate_loc_date" ON "monthly_climate" USING btree ("location","year","month");--> statement-breakpoint
CREATE INDEX "idx_projection_company" ON "projection" USING btree ("company_id","year","month");--> statement-breakpoint
CREATE INDEX "idx_alert_company" ON "alert" USING btree ("company_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_conversation_company" ON "conversation" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_hermes" ON "conversation" USING btree ("hermes_session_id");--> statement-breakpoint
CREATE INDEX "idx_message_conv" ON "message" USING btree ("conversation_id","created_at");