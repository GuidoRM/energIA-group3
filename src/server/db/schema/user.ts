import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { userRole } from "./enums";
import { organization } from "./organization";

/**
 * USER [UI] — belongs to an organization.
 * Named `app_user` because "user" is a reserved word in PostgreSQL.
 */
export const appUser = pgTable(
  "app_user",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: userRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_user_org").on(table.organizationId)],
);

export const appUserRelations = relations(appUser, ({ one }) => ({
  organization: one(organization, {
    fields: [appUser.organizationId],
    references: [organization.id],
  }),
}));
