"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createUserSchema, resetUserPasswordSchema, setBanSchema, setRoleSchema } from "@/lib/validation/auth";
import { requireRole } from "@/server/auth/guards";
import { runAction } from "@/server/run-action";
import { getUserService } from "@/server/services/user.service";

export async function createUserAction(input: unknown) {
  return runAction(async () => { const values = createUserSchema.parse(input); const actor = await requireRole("admin"); const result = await getUserService().create(values, actor.id); revalidatePath("/admin/users"); return result; });
}
export async function setUserRoleAction(input: unknown) {
  return runAction(async () => { const values = setRoleSchema.parse(input); const actor = await requireRole("admin"); const result = await getUserService().setRole(values, actor.id); revalidatePath("/admin/users"); return result; });
}
export async function setUserBanAction(input: unknown) {
  return runAction(async () => { const values = setBanSchema.parse(input); const actor = await requireRole("admin"); const result = await getUserService().setBan(values, actor.id); revalidatePath("/admin/users"); return result; });
}
export async function resetUserPasswordAction(input: unknown) {
  return runAction(async () => { const values = resetUserPasswordSchema.parse(input); const actor = await requireRole("admin"); const result = await getUserService().resetPassword(values, actor.id, await headers()); revalidatePath("/admin/users"); return result; });
}
