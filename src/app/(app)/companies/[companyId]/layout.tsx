import { notFound } from "next/navigation";

import { CompanyTabs } from "@/components/companies/company-tabs";
import { requireSession } from "@/lib/auth";
import { LOCATION_LABEL, STAGE_LABEL } from "@/lib/format";
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
  const company = await companyService
    .getForOrg(companyId, session.organizationId)
    .catch(() => null);
  if (!company) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-8 pt-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#281813]">{company.name}</h1>
            <span className="inline-flex items-center rounded-full bg-[#C15735] text-white px-2.5 py-0.5 text-xs font-semibold select-none shadow-sm">
              {STAGE_LABEL[company.onboardingStage]}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#8A726B] font-medium">
            {company.industry ?? "Sin rubro"} · {LOCATION_LABEL[company.location]}
          </p>
        </div>
        <div className="w-48">
          <div className="mb-1.5 flex justify-between text-xs text-[#8A726B] font-bold">
            <span>Perfil del gemelo</span>
            <span>{company.profileCompletion}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#FBF8F5] border border-[#d2baa9]/40" role="progressbar" aria-valuenow={company.profileCompletion} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full rounded-full bg-[#FD5212] transition-all duration-500"
              style={{ width: `${company.profileCompletion}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <CompanyTabs companyId={companyId} />
      </div>

      <div className="p-8">{children}</div>
    </div>
  );
}
