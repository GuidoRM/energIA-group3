import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { onboardingStage, tdfLocation } from "./enums";
import { organization } from "./organization";
import { equipment } from "./equipment";
import { projection } from "./projection";
import { alert } from "./alert";
import { conversation } from "./conversation";

/** COMPANY [UI]+[MCP] — the digital twin of an SME. */
export const company = pgTable(
  "company",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    industry: text("industry"),
    location: tdfLocation("location").notNull().default("rio_grande"),
    /** $ per m³ */
    gasTariff: numeric("gas_tariff", { precision: 12, scale: 4 }),
    /** $ per kWh */
    electricityTariff: numeric("electricity_tariff", {
      precision: 12,
      scale: 4,
    }),
    onboardingStage: onboardingStage("onboarding_stage")
      .notNull()
      .default("identity"),
    profileCompletion: smallint("profile_completion").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_company_org").on(table.organizationId),
    check("gas_tariff_check", sql`${table.gasTariff} >= 0`),
    check("electricity_tariff_check", sql`${table.electricityTariff} >= 0`),
    check(
      "profile_completion_check",
      sql`${table.profileCompletion} BETWEEN 0 AND 100`,
    ),
  ],
);

export const companyRelations = relations(company, ({ one, many }) => ({
  organization: one(organization, {
    fields: [company.organizationId],
    references: [organization.id],
  }),
  equipment: many(equipment),
  projections: many(projection),
  alerts: many(alert),
  conversations: many(conversation),
}));
