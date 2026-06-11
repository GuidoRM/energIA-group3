import { ok, parseJson, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { authService } from "@/services/auth.service";

/** POST /api/auth/register — crea usuario + organización (RF1.1). */
export function POST(request: Request) {
  return route(async () => {
    const input = await parseJson(request, registerSchema);
    const user = await authService.register(input);
    await setSessionCookie(user);
    return ok({ user }, 201);
  });
}
