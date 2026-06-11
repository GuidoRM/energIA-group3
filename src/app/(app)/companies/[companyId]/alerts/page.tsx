import { AlertsList } from "@/components/alerts/alerts-list";
import { alertService } from "@/services/alert.service";

/** RF7.1–7.3 — alertas de la empresa. */
export default async function AlertsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const alerts = await alertService.listByCompany(companyId);
  return <AlertsList initial={alerts} />;
}
