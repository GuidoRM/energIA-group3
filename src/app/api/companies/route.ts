import { ok, parseJson, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createCompanySchema } from "@/lib/validation";
import { companyService } from "@/services/company.service";

/** GET /api/companies — empresas de la organización (RF3.1). */
export function GET() {
  return route(async () => {
    const session = await requireSession();
    const companies = await companyService.listByOrg(session.organizationId);
    return ok({ companies });
  });
}

/** POST /api/companies — crear empresa (RF3.2). */
export function POST(request: Request) {
  return route(async () => {
    const session = await requireSession();
    const input = await parseJson(request, createCompanySchema);
    const company = await companyService.create(session.organizationId, input);
    return ok({ company }, 201);
  });
}
