import { EquipmentManager } from "@/components/equipment/equipment-manager";
import { equipmentService } from "@/services/equipment.service";

/** RF4.1–4.4 — ítems de consumo con su consumo calculado. */
export default async function EquipmentPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const equipment = await equipmentService.listByCompany(companyId);
  return <EquipmentManager companyId={companyId} initial={equipment} />;
}
