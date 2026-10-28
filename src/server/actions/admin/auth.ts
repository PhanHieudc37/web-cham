"use server";

import { headers } from "next/headers";
import { changePasswordSchema, emptyInputSchema, loginSchema } from "@/lib/validation/auth";
import { requireRole } from "@/server/auth/guards";
import { getClientIp } from "@/server/request";
import { runAction } from "@/server/run-action";
import { changePassword, signIn, signOut } from "@/server/services/auth.service";

export async function signInAction(input: unknown) {
  return runAction(async () => { const values = loginSchema.parse(input); return signIn(values, await headers(), await getClientIp()); });
}
export async function signOutAction(input: unknown) {
  return runAction(async () => { emptyInputSchema.parse(input); return signOut(await headers()); });
}
export async function changePasswordAction(input: unknown) {
  return runAction(async () => { const values = changePasswordSchema.parse(input); const person = await requireRole("staff"); return changePassword(values, await headers(), person.id); });
}
