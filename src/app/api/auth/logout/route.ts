import { ok, route } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

/** POST /api/auth/logout — cierra sesión (RF1.3). */
export function POST() {
  return route(async () => {
    await clearSessionCookie();
    return ok({ ok: true });
  });
}
