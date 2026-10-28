import "server-only";

import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { z } from "zod";
import type { AdminRole, SessionUserDTO } from "@/lib/auth";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import type { createUserSchema, resetUserPasswordSchema, setBanSchema, setRoleSchema } from "@/lib/validation/auth";
import { createAuth, getAuthConfiguration, type AuthConfiguration } from "@/server/auth/auth";
import { getDatabase, type Database, type DatabaseReader } from "@/server/db/client";
import { contactMessages, orders, session, user } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import type { AdminUserDTO } from "@/types/admin";

export function createUserService(db: Database, authConfig: AuthConfiguration) {
  async function assertActor(actorId: string, reader: DatabaseReader) {
    const [actor] = await reader.select().from(user).where(eq(user.id, actorId));
    if (!actor || actor.banned || actor.role !== "admin") throw new AppError("FORBIDDEN");
  }
  async function lockAccounts(reader: DatabaseReader) {
    await reader.execute(sql`SELECT pg_advisory_xact_lock(726038)`);
  }
  async function list(actorId: string, query = "", requestedPage = 1) {
    await assertActor(actorId, db);
    const escaped = query.trim().slice(0, 100).replace(/[\\%_]/g, "\\$&");
    const condition = and(or(eq(user.role, "admin"), eq(user.role, "staff")), escaped ? or(ilike(user.name, `%${escaped}%`), ilike(user.email, `%${escaped}%`)) : undefined);
    const [total] = await db.select({ count: count() }).from(user).where(condition);
    const totalPages = Math.max(1, Math.ceil(total.count / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), totalPages);
    const rows = await db.select().from(user).where(condition).orderBy(desc(user.createdAt), asc(user.id)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
    return { users: rows.map((row): AdminUserDTO => ({ id: row.id, name: row.name, email: row.email, role: row.role === "admin" ? "admin" : "staff", banned: Boolean(row.banned), createdAt: row.createdAt.toISOString() })), total: total.count, page, totalPages };
  }
  async function create(input: z.output<typeof createUserSchema>, actorId: string) {
    return db.transaction(async (tx) => {
      await lockAccounts(tx); await assertActor(actorId, tx);
      const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, input.email));
      if (existing) throw new AppError("CONFLICT", "Email đã được sử dụng.", undefined, { email: "Email đã được sử dụng" });
      const auth = createAuth(tx, authConfig);
      const result = await auth.api.createUser({ body: input });
      return { id: result.user.id };
    });
  }
  async function update(input: { userId: string; role?: AdminRole; banned?: boolean }, actorId: string) {
    return db.transaction(async (tx) => {
      await lockAccounts(tx); await assertActor(actorId, tx);
      const [target] = await tx.select().from(user).where(eq(user.id, input.userId)).for("update");
      if (!target) throw new AppError("NOT_FOUND");
      if (target.role !== "admin" && target.role !== "staff") throw new AppError("FORBIDDEN");
      if (actorId === target.id && (input.banned === true || (input.role !== undefined && input.role !== "admin"))) throw new AppError("FORBIDDEN", "Bạn không thể tự khóa hoặc tự hạ quyền tài khoản của mình.");
      const nextRole = input.role ?? target.role, nextBanned = input.banned ?? target.banned;
      if (target.role === "admin" && !target.banned && (nextRole !== "admin" || nextBanned)) {
        const [active] = await tx.select({ total: count() }).from(user).where(and(eq(user.role, "admin"), eq(user.banned, false)));
        if (active.total <= 1) throw new AppError("CONFLICT", "Hệ thống phải còn ít nhất một quản trị viên đang hoạt động.");
      }
      await tx.update(user).set({ role: nextRole, banned: Boolean(nextBanned), banReason: nextBanned ? "Quản trị viên khóa tài khoản" : null, banExpires: null, updatedAt: new Date() }).where(eq(user.id, target.id));
      if (input.banned === true || (input.role !== undefined && input.role !== target.role)) await tx.delete(session).where(eq(session.userId, target.id));
      return { id: target.id };
    });
  }
  async function resetPassword(input: z.output<typeof resetUserPasswordSchema>, actorId: string, requestHeaders: Headers) {
    return db.transaction(async (tx) => {
      await lockAccounts(tx); await assertActor(actorId, tx);
      if (actorId === input.userId) throw new AppError("FORBIDDEN", "Hãy dùng Đổi mật khẩu trong menu tài khoản.");
      const [target] = await tx.select().from(user).where(eq(user.id, input.userId));
      if (!target) throw new AppError("NOT_FOUND");
      if (target.role !== "admin" && target.role !== "staff") throw new AppError("FORBIDDEN");
      await createAuth(tx, authConfig).api.setUserPassword({ body: input, headers: requestHeaders });
      await tx.delete(session).where(eq(session.userId, target.id));
      return { id: target.id };
    });
  }
  return { list, create, setRole: (input: z.output<typeof setRoleSchema>, actorId: string) => update(input, actorId), setBan: (input: z.output<typeof setBanSchema>, actorId: string) => update(input, actorId), resetPassword };
}
export const getUserService = () => createUserService(getDatabase(), getAuthConfiguration());
export async function getAdminShellData(person: SessionUserDTO) {
  const db = getDatabase();
  const [[pending], [messages]] = await Promise.all([
    db.select({ total: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ total: count() }).from(contactMessages).where(eq(contactMessages.status, "new")),
  ]);
  return { person, pendingOrders: pending.total, newMessages: messages.total };
}
