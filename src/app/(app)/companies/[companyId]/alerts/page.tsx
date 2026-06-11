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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#0f172a]">Centro de Alertas</h2>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Monitoreo de consumo y costos energéticos · Se generan automáticamente al proyectar consumos fuera del umbral.
        </p>
      </div>
      <AlertsList initial={alerts} />
    </div>
  );
}
