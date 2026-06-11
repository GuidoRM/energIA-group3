import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appUser, organization } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/lib/types";
import type { LoginInput, RegisterInput } from "@/lib/validation";

/**
 * auth.service — registro y login (§Auth).
 * Devuelve un SessionUser que el handler firma en una cookie httpOnly.
 */
export const authService = {
  /** RF1.1 + RF2.1 — crea usuario y (opcionalmente) su organización. */
  async register(input: RegisterInput): Promise<SessionUser> {
    const existing = await db.query.appUser.findFirst({
      where: eq(appUser.email, input.email),
    });
    if (existing) throw AppError.conflict("El email ya está registrado");

    return db.transaction(async (tx) => {
      let organizationId = input.organizationId;
      let role: "admin" | "member" = "member";

      if (!organizationId) {
        // Sin organización indicada → crea una nueva y el usuario es admin.
        const [org] = await tx
          .insert(organization)
          .values({ name: input.organizationName ?? `${input.name}'s org` })
          .returning();
        organizationId = org!.id;
        role = "admin";
      } else {
        const org = await tx.query.organization.findFirst({
          where: eq(organization.id, organizationId),
        });
        if (!org) throw AppError.notFound("Organización no encontrada");
      }

      const passwordHash = await hashPassword(input.password);
      const [user] = await tx
        .insert(appUser)
        .values({
          organizationId,
          email: input.email,
          passwordHash,
          name: input.name,
          role,
        })
        .returning();

      return toSession(user!);
    });
  },

  /** RF1.2 — login con email + contraseña. */
  async login(input: LoginInput): Promise<SessionUser> {
    const user = await db.query.appUser.findFirst({
      where: eq(appUser.email, input.email),
    });
    if (!user) throw AppError.unauthorized("Credenciales inválidas");

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw AppError.unauthorized("Credenciales inválidas");

    return toSession(user);
  },
};

function toSession(user: typeof appUser.$inferSelect): SessionUser {
  return {
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
