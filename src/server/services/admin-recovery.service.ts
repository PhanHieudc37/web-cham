import "server-only";
import { hashPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";
import { adminRecoverySchema } from "@/lib/validation/production";
import type { Database } from "@/server/db/client";
import { account, session, user } from "@/server/db/schema";

// Offline owner command only: never expose this service through an action or route.
export async function recoverAdminPassword(db: Database, raw: unknown) {
  const input = adminRecoverySchema.parse(raw), password = await hashPassword(input.ADMIN_RECOVERY_PASSWORD);
  await db.transaction(async (transaction) => {
    await transaction.execute(sql`SELECT pg_advisory_xact_lock(726038)`);
    const [target] = await transaction.select().from(user).where(eq(user.email, input.ADMIN_RECOVERY_EMAIL)).for("update");
    if (!target || target.role !== "admin" || target.banned) throw new Error("Chỉ khôi phục admin hiện có, đang hoạt động; không đổi vai trò hoặc mở khóa tài khoản.");
    const [credential] = await transaction.select({ id: account.id }).from(account).where(and(eq(account.userId, target.id), eq(account.providerId, "credential")));
    if (!credential) throw new Error("Admin chưa có tài khoản mật khẩu; dừng khôi phục.");
    await transaction.update(account).set({ password, updatedAt: new Date() }).where(eq(account.id, credential.id));
    await transaction.delete(session).where(eq(session.userId, target.id));
  });
}
