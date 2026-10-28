import "server-only";

import { ERROR_MESSAGES, type ActionError, type ErrorCode } from "@/lib/result";
export class AppError extends Error {
  constructor(public readonly code: ErrorCode, message = ERROR_MESSAGES[code], public readonly details?: unknown, public readonly fields?: Record<string, string>) { super(message); this.name = "AppError"; }
  toJSON(): ActionError { return { code: this.code, message: this.message, ...(this.details === undefined ? {} : { details: this.details }), ...(this.fields ? { fields: this.fields } : {}) }; }
}
