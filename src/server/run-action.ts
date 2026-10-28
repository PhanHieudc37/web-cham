import "server-only";

import { ZodError } from "zod";
import { ERROR_MESSAGES, type ActionResult } from "@/lib/result";
import { AppError } from "./errors";

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try { return { ok: true, data: await fn() }; }
  catch (error) {
    if (error instanceof ZodError) return { ok: false, error: { code: "VALIDATION_ERROR", message: ERROR_MESSAGES.VALIDATION_ERROR, fields: Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message])) } };
    if (error instanceof AppError) return { ok: false, error: error.toJSON() };
    console.error("[action] Internal operation failed");
    return { ok: false, error: { code: "INTERNAL", message: ERROR_MESSAGES.INTERNAL } };
  }
}
