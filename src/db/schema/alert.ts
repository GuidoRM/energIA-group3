import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { alertSeverity, alertType } from "./enums";
import { company } from "./company";
import { projection } from "./projection";

/** ALERT [MCP] — fired when a projection exceeds a threshold. */
export const alert = pgTable(
  "alert",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    projectionId: uuid("projection_id").references(() => projection.id, {
      onDelete: "set null",
    }),
    type: alertType("type").notNull(),
    severity: alertSeverity("severity").notNull().default("medium"),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_alert_company").on(table.companyId, table.isRead)],
);

export const alertRelations = relations(alert, ({ one }) => ({
  company: one(company, {
    fields: [alert.companyId],
    references: [company.id],
  }),
  projection: one(projection, {
    fields: [alert.projectionId],
    references: [projection.id],
  }),
}));
