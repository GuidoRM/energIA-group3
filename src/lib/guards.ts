import "server-only";

import { requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { Company, SessionUser } from "@/lib/types";
import { alertService } from "@/services/alert.service";
import { companyService } from "@/services/company.service";
import { equipmentService } from "@/services/equipment.service";

/**
 * Guardas reutilizables que centralizan el aislamiento multi-tenant (RNF2):
 * resuelven la sesión y verifican que el recurso pertenezca a la organización.
 */

export async function requireCompany(
  companyId: string,
): Promise<{ session: SessionUser; company: Company }> {
  const session = await requireSession();
  const company = await companyService.getForOrg(
    companyId,
    session.organizationId,
  );
  return { session, company };
}

/** Resuelve un equipo y verifica que su empresa pertenece a la organización. */
export async function requireEquipment(equipmentId: string) {
  const session = await requireSession();
  const equipment = await equipmentService.getById(equipmentId);
  if (!equipment) throw AppError.notFound("Equipo no encontrado");
  const company = await companyService.getForOrg(
    equipment.companyId,
    session.organizationId,
  );
  return { session, company, equipment };
}

/** Resuelve una alerta y verifica que su empresa pertenece a la organización. */
export async function requireAlert(alertId: string) {
  const session = await requireSession();
  const alert = await alertService.getById(alertId);
  if (!alert) throw AppError.notFound("Alerta no encontrada");
  const company = await companyService.getForOrg(
    alert.companyId,
    session.organizationId,
  );
  return { session, company, alert };
}
