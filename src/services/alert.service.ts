import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { alert } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { Alert } from "@/lib/types";

type AlertType = Alert["type"];
type AlertSeverity = Alert["severity"];

/** Severidad derivada de la magnitud de la variación (%). */
export function severityFromVariation(variationPct: number): AlertSeverity {
  const v = Math.abs(variationPct);
  if (v >= 30) return "high";
  if (v >= 20) return "medium";
  return "low";
}

export const alertService = {
  /** RF7.2 — alertas de la empresa (no leídas primero). */
  listByCompany(companyId: string): Promise<Alert[]> {
    return db.query.alert.findMany({
      where: eq(alert.companyId, companyId),
      orderBy: [desc(alert.isRead), desc(alert.createdAt)],
    });
  },

  getById(id: string): Promise<Alert | undefined> {
    return db.query.alert.findFirst({ where: eq(alert.id, id) });
  },

  /** RF7.1 — crear alerta (la dispara projection.service al superar el umbral). */
  async create(params: {
    companyId: string;
    projectionId?: string | null;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
  }): Promise<Alert> {
    const [row] = await db
      .insert(alert)
      .values({
        companyId: params.companyId,
        projectionId: params.projectionId ?? null,
        type: params.type,
        severity: params.severity,
        message: params.message,
      })
      .returning();
    return row!;
  },

  /** RF7.3 — marcar como leída/no leída. */
  async setRead(id: string, isRead: boolean): Promise<Alert> {
    const [row] = await db
      .update(alert)
      .set({ isRead })
      .where(eq(alert.id, id))
      .returning();
    if (!row) throw AppError.notFound("Alerta no encontrada");
    return row;
  },

  countUnread(companyId: string): Promise<number> {
    return db.$count(alert, and(eq(alert.companyId, companyId), eq(alert.isRead, false)));
  },
};
