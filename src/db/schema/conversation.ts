import { relations, sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { messageRole } from "./enums";
import { company } from "./company";
import { appUser } from "./user";

/**
 * CONVERSATION [UI] — groups the messages of a chat with Hermes.
 * `hermesSessionId` chains context on Hermes's side.
 */
export const conversation = pgTable(
  "conversation",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => appUser.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    hermesSessionId: text("hermes_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_conversation_company").on(table.companyId),
    index("idx_conversation_hermes").on(table.hermesSessionId),
  ],
);

/** MESSAGE [UI]+[MCP] — each chat turn. */
export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    role: messageRole("role").notNull(),
    content: text("content").notNull().default(""),
    /** if role='tool': which MCP tool was called */
    toolName: text("tool_name"),
    /** tool arguments, if applicable */
    toolArgs: jsonb("tool_args"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_message_conv").on(table.conversationId, table.createdAt),
  ],
);

export const conversationRelations = relations(
  conversation,
  ({ one, many }) => ({
    company: one(company, {
      fields: [conversation.companyId],
      references: [company.id],
    }),
    user: one(appUser, {
      fields: [conversation.userId],
      references: [appUser.id],
    }),
    messages: many(message),
  }),
);

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
}));
