import { ok, route } from "@/lib/api";
import { getSession } from "@/lib/auth";

/** GET /api/auth/me — usuario de la sesión actual (o null). */
export function GET() {
  return route(async () => {
    const user = await getSession();
    return ok({ user });
  });
}
