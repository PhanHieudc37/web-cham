import "server-only";

import { APIError } from "better-auth/api";
import type { z } from "zod";
import { safeAdminNext } from "@/lib/auth";
import type { changePasswordSchema, loginSchema } from "@/lib/validation/auth";
import { getAuth } from "@/server/auth/auth";
import { AppError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";

export async function signIn(input: z.output<typeof loginSchema>, requestHeaders: Headers, ip: string) {
  await rateLimit(`login:${ip}`, 10, 60);
  try {
    await getAuth().api.signInEmail({ body: { email: input.email, password: input.password, rememberMe: true }, headers: requestHeaders });
    return { next: safeAdminNext(input.next) };
  } catch (error) {
    if (error instanceof APIError) throw new AppError("UNAUTHORIZED", "Email hoặc mật khẩu không đúng");
    throw error;
  }
}
export async function signOut(requestHeaders: Headers) {
  await getAuth().api.signOut({ headers: requestHeaders });
  return { signedOut: true };
}
export async function changePassword(input: z.output<typeof changePasswordSchema>, requestHeaders: Headers, userId: string) {
  await rateLimit(`password:${userId}`, 5, 600);
  try {
    await getAuth().api.changePassword({ body: { currentPassword: input.currentPassword, newPassword: input.newPassword, revokeOtherSessions: true }, headers: requestHeaders });
    return { changed: true };
  } catch (error) {
    if (error instanceof APIError) throw new AppError("VALIDATION_ERROR", "Mật khẩu hiện tại không đúng.", undefined, { currentPassword: "Mật khẩu hiện tại không đúng" });
    throw error;
  }
}
