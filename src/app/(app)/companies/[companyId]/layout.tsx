import { notFound } from "next/navigation";

import { CompanyTabs } from "@/components/companies/company-tabs";
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
      {/* Company header */}
      <div className="border-b border-[#e2e8f0] bg-white px-8 pt-4 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">{company.name}</h1>
              <span className="inline-flex items-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] px-2.5 py-0.5 text-xs font-bold">
                {STAGE_LABEL[company.onboardingStage]}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-[#64748b]">
              {company.industry ?? "Sin rubro"} · {LOCATION_LABEL[company.location]}
            </p>
          </div>

          {/* Profile completion */}
          <div className="w-52">
            <div className="mb-1.5 flex justify-between text-xs font-bold text-[#64748b]">
              <span>Perfil del gemelo</span>
              <span className={company.profileCompletion === 100 ? "text-[#0ea5e9]" : "text-[#FD5212]"}>
                {company.profileCompletion}%
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]"
              role="progressbar"
              aria-valuenow={company.profileCompletion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${company.profileCompletion}%`,
                  background: company.profileCompletion === 100
                    ? "#0ea5e9"
                    : "linear-gradient(to right, #FD5212, #fb923c)",
                }}
              />
            </div>
          </div>
        </div>

        <CompanyTabs companyId={companyId} unreadAlerts={unreadAlerts} />
      </div>

      <div className="p-8">{children}</div>
    </div>
  );
}
