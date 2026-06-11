import { notFound } from "next/navigation";

import { ProjectionPanel } from "@/components/projections/projection-panel";
import { requireSession } from "@/lib/auth";
import { climateService } from "@/services/climate.service";
import { companyService } from "@/services/company.service";
import { projectionService } from "@/services/projection.service";

/** RF6.1–6.3 — proyección de consumo y costo. */
export default async function ProjectionsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const session = await requireSession();
  const company = await companyService
    .getForOrg(companyId, session.organizationId)
    .catch(() => null);
  if (!company) notFound();

  const currentMonth = new Date().getMonth() + 1;
  const [projections, suggestedTemp] = await Promise.all([
    projectionService.listByCompany(companyId),
    climateService.forecastTempFor(company.location, currentMonth),
  ]);

  return (
    <ProjectionPanel
      companyId={companyId}
      initial={projections}
      suggestedTemp={suggestedTemp}
    />
  );
}
