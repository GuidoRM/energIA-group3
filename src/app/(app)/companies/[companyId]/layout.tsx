import { notFound } from "next/navigation";

import { CompanyTabs } from "@/components/companies/company-tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { requireSession } from "@/lib/auth";
import { LOCATION_LABEL, STAGE_LABEL } from "@/lib/format";
import { alertService } from "@/services/alert.service";
import { companyService } from "@/services/company.service";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const session = await requireSession();
  const [company, unreadAlerts] = await Promise.all([
    companyService.getForOrg(companyId, session.organizationId).catch(() => null),
    alertService.countUnread(companyId),
  ]);
  if (!company) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-8 pt-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            <Badge variant="secondary">
              {STAGE_LABEL[company.onboardingStage]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {company.industry ?? "Sin rubro"} · {LOCATION_LABEL[company.location]}
          </p>
        </div>
        <div className="w-48">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Perfil del gemelo</span>
            <span>{company.profileCompletion}%</span>
          </div>
          <Progress value={company.profileCompletion} />
        </div>
      </div>

      <div className="mt-4">
        <CompanyTabs companyId={companyId} unreadAlerts={unreadAlerts} />
      </div>

      <div className="p-8">{children}</div>
    </div>
  );
}
