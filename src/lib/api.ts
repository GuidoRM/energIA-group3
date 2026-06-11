import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { AppError } from "@/lib/errors";

/**
 * Utilidades para route handlers finos (§7): parsean/validan con Zod y
 * traducen AppError / ZodError a respuestas HTTP consistentes.
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/** Valida un body JSON contra un esquema Zod; lanza AppError.validation si falla. */
export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw AppError.badRequest("Body JSON inválido");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw AppError.validation("Datos inválidos", result.error.flatten());
  }
  return result.data;
}

/**
 * Envuelve la lógica de un handler y centraliza el manejo de errores.
 * Uso: `export const POST = (req) => route(() => { ... })`
 */
export async function route(
  handler: () => Promise<Response> | Response,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.status },
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Datos inválidos", details: error.flatten() } },
        { status: 422 },
      );
    }
    console.error("Unhandled route error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Error interno" } },
      { status: 500 },
    );
  }
}
