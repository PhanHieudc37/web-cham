import "server-only";

import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { count, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { verifyPassword } from "better-auth/crypto";
import { createDatabase } from "@/server/db/client";
import { account, session, user } from "@/server/db/schema";
import { createUserService } from "@/server/services/user.service";
import { createAuth } from "./auth";

const testUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!testUrl)("Better Auth accounts and sessions", () => {
  let database: ReturnType<typeof createDatabase>;
  let auth: ReturnType<typeof createAuth>;
  let service: ReturnType<typeof createUserService>;
  let adminId: string, staffId: string;
  const config = { secret: "test-auth-session-secret-at-least-32-characters", baseURL: "http://localhost:3100" };
  const password = "Private-test-password-12345";
  beforeAll(async () => {
    if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL");
    const target = new URL(testUrl);
    if (!target.pathname.endsWith("_test")) throw new Error("Database kiểm thử phải có hậu tố _test");
    for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) {
      const parsed = new URL(other); if (parsed.host === target.host && parsed.pathname === target.pathname) throw new Error("Không chạy test trên dev/prod");
    }
    database = createDatabase(testUrl); await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
    auth = createAuth(database.db, config); service = createUserService(database.db, config);
  });
  afterAll(async () => { if (database) await database.connection.end(); });
  beforeEach(async () => {
    await database.db.execute(sql`TRUNCATE "user" CASCADE`);
    adminId = (await auth.api.createUser({ body: { name: "Quản trị thử", email: "admin@example.test", password, role: "admin" } })).user.id;
    staffId = (await auth.api.createUser({ body: { name: "Nhân viên thử", email: "staff@example.test", password, role: "staff" } })).user.id;
  });
  async function signIn(email = "staff@example.test", inputPassword = password) {
    const response = await auth.api.signInEmail({ body: { email, password: inputPassword }, asResponse: true });
    expect(response.status).toBe(200);
    return new Headers({ cookie: (response.headers.get("set-cookie") ?? "").split(";")[0] });
  }
  it("authenticates the right password, reads a session, and revokes it on logout", async () => {
    await expect(auth.api.signInEmail({ body: { email: "staff@example.test", password: "wrong-password" } })).rejects.toMatchObject({ status: "UNAUTHORIZED" });
    const headers = await signIn();
    expect((await auth.api.getSession({ headers }))?.user.id).toBe(staffId);
    await auth.api.signOut({ headers });
    expect(await auth.api.getSession({ headers })).toBeNull();
  });
  it("disables public signup", async () => {
    const response = await auth.handler(new Request(`${config.baseURL}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin: config.baseURL }, body: JSON.stringify({ name: "Người lạ", email: "stranger@example.test", password }) }));
    expect(response.status).toBe(400);
    expect((await database.db.select({ total: count() }).from(user))[0].total).toBe(2);
  });
  it("creates accounts through Better Auth with hashed passwords and rejects duplicate email", async () => {
    const result = await service.create({ name: "Thành viên mới", email: "new@example.test", password, role: "staff" }, adminId);
    const [credential] = await database.db.select().from(account).where(eq(account.userId, result.id));
    expect(credential.password).not.toBe(password); expect(await verifyPassword({ hash: credential.password ?? "", password })).toBe(true);
    await expect(service.create({ name: "Trùng", email: "new@example.test", password, role: "admin" }, adminId)).rejects.toMatchObject({ code: "CONFLICT", fields: { email: "Email đã được sử dụng" } });
    await expect(service.create({ name: "Không quyền", email: "denied@example.test", password, role: "admin" }, staffId)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("does not allow self-demotion or self-ban", async () => {
    await expect(service.setRole({ userId: adminId, role: "staff" }, adminId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.setBan({ userId: adminId, banned: true }, adminId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await database.db.select().from(user).where(eq(user.id, adminId)))[0]).toMatchObject({ role: "admin", banned: false });
  });
  it("serializes two admins trying to demote each other and leaves one active admin", async () => {
    await service.setRole({ userId: staffId, role: "admin" }, adminId);
    const results = await Promise.allSettled([service.setRole({ userId: staffId, role: "staff" }, adminId), service.setRole({ userId: adminId, role: "staff" }, staffId)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await database.db.select().from(user)).filter((person) => person.role === "admin" && !person.banned)).toHaveLength(1);
  });
  it("revokes sessions on banning, blocks login, and allows unbanning", async () => {
    const headers = await signIn();
    await service.setBan({ userId: staffId, banned: true }, adminId);
    expect(await auth.api.getSession({ headers })).toBeNull();
    await expect(auth.api.signInEmail({ body: { email: "staff@example.test", password } })).rejects.toBeDefined();
    await service.setBan({ userId: staffId, banned: false }, adminId);
    expect((await auth.api.getSession({ headers: await signIn() }))?.user.id).toBe(staffId);
  });
  it("revokes sessions on role changes and uses the new role on the next login", async () => {
    const headers = await signIn();
    await service.setRole({ userId: staffId, role: "admin" }, adminId);
    expect(await auth.api.getSession({ headers })).toBeNull();
    expect((await auth.api.getSession({ headers: await signIn() }))?.user.role).toBe("admin");
  });
  it("resets a staff password and revokes their sessions", async () => {
    const staffHeaders = await signIn(), adminHeaders = await signIn("admin@example.test");
    await service.resetPassword({ userId: staffId, newPassword: "New-staff-password-12345" }, adminId, adminHeaders);
    expect(await auth.api.getSession({ headers: staffHeaders })).toBeNull();
    await expect(auth.api.signInEmail({ body: { email: "staff@example.test", password } })).rejects.toBeDefined();
    expect((await auth.api.getSession({ headers: await signIn("staff@example.test", "New-staff-password-12345") }))?.user.id).toBe(staffId);
  });
  it("changes one's own password only with the old password and replaces sessions", async () => {
    const headers = await signIn();
    await expect(auth.api.changePassword({ body: { currentPassword: "wrong", newPassword: "New-password-12345" }, headers })).rejects.toBeDefined();
    await auth.api.changePassword({ body: { currentPassword: password, newPassword: "New-password-12345", revokeOtherSessions: true }, headers });
    expect(await auth.api.getSession({ headers })).toBeNull();
    expect((await database.db.select().from(session)).filter((row) => row.userId === staffId)).toHaveLength(1);
    expect((await auth.api.getSession({ headers: await signIn("staff@example.test", "New-password-12345") }))?.user.id).toBe(staffId);
  });
  it("paginates and searches accounts without returning hashes or tokens", async () => {
    const found = await service.list(adminId, "staff@");
    expect(found.total).toBe(1); expect(found.users[0]).toMatchObject({ role: "staff", banned: false });
    expect(found.users[0]).not.toHaveProperty("password");
    await expect(service.list(staffId)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
