/**
 * Typed application errors (convención §13).
 * Services throw these; route handlers translate them to HTTP responses.
 */

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "BAD_REQUEST"
  | "INTERNAL";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 422,
  BAD_REQUEST: 400,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static unauthorized(message = "No autenticado") {
    return new AppError("UNAUTHORIZED", message);
  }
  static forbidden(message = "Sin permiso") {
    return new AppError("FORBIDDEN", message);
  }
  static notFound(message = "No encontrado") {
    return new AppError("NOT_FOUND", message);
  }
  static conflict(message: string) {
    return new AppError("CONFLICT", message);
  }
  static badRequest(message: string, details?: unknown) {
    return new AppError("BAD_REQUEST", message, details);
  }
  static validation(message: string, details?: unknown) {
    return new AppError("VALIDATION", message, details);
  }
}
