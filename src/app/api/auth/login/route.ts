import { ok, parseJson, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { authService } from "@/services/auth.service";

/** POST /api/auth/login — inicia sesión y setea la cookie (RF1.2). */
export function POST(request: Request) {
  return route(async () => {
    const input = await parseJson(request, loginSchema);
    const user = await authService.login(input);
    await setSessionCookie(user);
    return ok({ user });
  });
}
