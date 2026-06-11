import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { equipment } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { Equipment, EquipmentWithConsumption } from "@/lib/types";
import type {
  CreateEquipmentInput,
  UpdateEquipmentInput,
} from "@/lib/validation";

/**
 * equipment.service — tabla `equipment`.
 * Calcula el consumo base mensual de cada ítem (RF4.4):
 *   consumo = potencia × horas/día × días/mes
 */

export function monthlyConsumption(item: Equipment): number {
  return (
    Number(item.power) * Number(item.hoursPerDay) * Number(item.daysPerMonth)
  );
}

export const equipmentService = {
  /** RF4.1 + RF4.4 — equipos con su consumo calculado. */
  async listByCompany(companyId: string): Promise<EquipmentWithConsumption[]> {
    const rows = await db.query.equipment.findMany({
      where: eq(equipment.companyId, companyId),
      orderBy: asc(equipment.createdAt),
    });
    return rows.map((item) => ({
      ...item,
      monthlyConsumption: monthlyConsumption(item),
    }));
  },

  getById(id: string): Promise<Equipment | undefined> {
    return db.query.equipment.findFirst({ where: eq(equipment.id, id) });
  },

  /** RF4.2 — agregar equipo. */
  async create(
    companyId: string,
    input: CreateEquipmentInput,
  ): Promise<Equipment> {
    const [row] = await db
      .insert(equipment)
      .values({
        companyId,
        name: input.name,
        vector: input.vector,
        power: String(input.power),
        hoursPerDay: String(input.hoursPerDay ?? 0),
        daysPerMonth: input.daysPerMonth ?? 0,
        processStage: input.processStage,
      })
      .returning();
    return row!;
  },

  /** RF4.3 — editar equipo. */
  async update(id: string, input: UpdateEquipmentInput): Promise<Equipment> {
    const [row] = await db
      .update(equipment)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.vector !== undefined && { vector: input.vector }),
        ...(input.power !== undefined && { power: String(input.power) }),
        ...(input.hoursPerDay !== undefined && {
          hoursPerDay: String(input.hoursPerDay),
        }),
        ...(input.daysPerMonth !== undefined && {
          daysPerMonth: input.daysPerMonth,
        }),
        ...(input.processStage !== undefined && {
          processStage: input.processStage,
        }),
      })
      .where(eq(equipment.id, id))
      .returning();
    if (!row) throw AppError.notFound("Equipo no encontrado");
    return row;
  },

  /** RF4.3 — eliminar equipo. */
  async remove(id: string): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  },
};
