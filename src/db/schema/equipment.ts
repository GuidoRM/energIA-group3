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

import { energyVector } from "./enums";
import { company } from "./company";

/** EQUIPMENT [MCP]+[UI] — consumption items of each company. */
export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    vector: energyVector("vector").notNull(),
    /** kW (electricity) or m³/h (gas) */
    power: numeric("power", { precision: 12, scale: 3 }).notNull(),
    hoursPerDay: numeric("hours_per_day", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    daysPerMonth: smallint("days_per_month").notNull().default(0),
    processStage: text("process_stage"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_equipment_company").on(table.companyId),
    check("power_check", sql`${table.power} > 0`),
    check("hours_per_day_check", sql`${table.hoursPerDay} BETWEEN 0 AND 24`),
    check("days_per_month_check", sql`${table.daysPerMonth} BETWEEN 0 AND 31`),
  ],
);

export const equipmentRelations = relations(equipment, ({ one }) => ({
  company: one(company, {
    fields: [equipment.companyId],
    references: [company.id],
  }),
}));
