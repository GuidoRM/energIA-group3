import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { appUser } from "./user";
import { company } from "./company";

/** ORGANIZATION [UI] — top-level tenant. */
export const organization = pgTable("organization", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const organizationRelations = relations(organization, ({ many }) => ({
  users: many(appUser),
  companies: many(company),
}));
