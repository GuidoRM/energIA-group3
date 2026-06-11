import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { conversation, message } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { Conversation, Message } from "@/lib/types";

type MessageRole = Message["role"];

/**
 * conversation.service — chats con Hermes (`conversation`) y sus turnos
 * (`message`). Persistir cada turno permite mostrarlos y navegarlos (RF8.2/8.3).
 */
export const conversationService = {
  /** RF8.3 — conversaciones de la empresa. */
  listByCompany(companyId: string): Promise<Conversation[]> {
    return db.query.conversation.findMany({
      where: eq(conversation.companyId, companyId),
      orderBy: desc(conversation.updatedAt),
    });
  },

  getById(id: string): Promise<Conversation | undefined> {
    return db.query.conversation.findFirst({ where: eq(conversation.id, id) });
  },

  /** Turnos de una conversación, en orden cronológico (RF8.2). */
  listMessages(conversationId: string): Promise<Message[]> {
    return db.query.message.findMany({
      where: eq(message.conversationId, conversationId),
      orderBy: asc(message.createdAt),
    });
  },

  async create(params: {
    companyId: string;
    userId?: string | null;
    title?: string | null;
    hermesSessionId?: string | null;
  }): Promise<Conversation> {
    const [row] = await db
      .insert(conversation)
      .values({
        companyId: params.companyId,
        userId: params.userId ?? null,
        title: params.title ?? null,
        hermesSessionId: params.hermesSessionId ?? null,
      })
      .returning();
    return row!;
  },

  /** Devuelve la conversación indicada o crea una nueva para la empresa. */
  async resolve(params: {
    companyId: string;
    userId?: string | null;
    conversationId?: string;
  }): Promise<Conversation> {
    if (params.conversationId) {
      const existing = await this.getById(params.conversationId);
      if (!existing || existing.companyId !== params.companyId) {
        throw AppError.notFound("Conversación no encontrada");
      }
      return existing;
    }
    return this.create({ companyId: params.companyId, userId: params.userId });
  },

  /** RF8.2 — persiste un turno. */
  async addMessage(params: {
    conversationId: string;
    role: MessageRole;
    content: string;
    toolName?: string | null;
    toolArgs?: unknown;
  }): Promise<Message> {
    const [row] = await db
      .insert(message)
      .values({
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
        toolName: params.toolName ?? null,
        toolArgs: params.toolArgs ?? null,
      })
      .returning();
    // toca updated_at para reordenar la lista de conversaciones.
    await db
      .update(conversation)
      .set({ updatedAt: new Date() })
      .where(eq(conversation.id, params.conversationId));
    return row!;
  },

  async setHermesSession(id: string, hermesSessionId: string): Promise<void> {
    await db
      .update(conversation)
      .set({ hermesSessionId })
      .where(eq(conversation.id, id));
  },
};
