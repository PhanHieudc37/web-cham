import "server-only";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { createDatabase } from "@/server/db/client";
import { account, session, user } from "@/server/db/schema";
import { recoverAdminPassword } from "./admin-recovery.service";
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("offline admin recovery on isolated PostgreSQL", () => {
  let database: ReturnType<typeof createDatabase>, adminId: string, staffId: string;
  const original = "Original-test-password-12345", replacement = "Replacement-test-password-12345";
  beforeAll(async () => {
    if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Chỉ dùng database _test");
    for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) if (new URL(other).host === new URL(url).host && new URL(other).pathname === new URL(url).pathname) throw new Error("Không dùng dev/prod");
    database = createDatabase(url); await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
  }, 60000);
  afterAll(async () => { if (database) await database.connection.end(); });
  beforeEach(async () => {
    await database.db.execute(sql`TRUNCATE "user" CASCADE`);
    adminId = randomUUID(); staffId = randomUUID();
    await database.db.insert(user).values([{ id: adminId, name: "Admin test", email: "owner@example.test", role: "admin", banned: false }, { id: staffId, name: "Staff test", email: "staff@example.test", role: "staff", banned: false }]);
    for (const id of [adminId, staffId]) {
      await database.db.insert(account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(original) });
      await database.db.insert(session).values({ id: randomUUID(), userId: id, token: randomUUID(), expiresAt: new Date(Date.now() + 3600000) });
    }
  });
  it("changes only the active admin password and revokes every session for that admin", async () => {
    await recoverAdminPassword(database.db, { ADMIN_RECOVERY_EMAIL: "OWNER@example.test", ADMIN_RECOVERY_PASSWORD: replacement });
    const [credential] = await database.db.select().from(account).where(eq(account.userId, adminId));
    expect(await verifyPassword({ hash: credential.password!, password: replacement })).toBe(true);
    expect(await verifyPassword({ hash: credential.password!, password: original })).toBe(false);
    expect(await database.db.select().from(session).where(eq(session.userId, adminId))).toHaveLength(0);
    expect(await database.db.select().from(session).where(eq(session.userId, staffId))).toHaveLength(1);
    expect((await database.db.select().from(user).where(eq(user.id, adminId)))[0]).toMatchObject({ role: "admin", banned: false });
  });
  it("refuses staff, absent users, banned admins and missing credentials without creating or unbanning accounts", async () => {
    for (const email of ["staff@example.test", "absent@example.test"]) await expect(recoverAdminPassword(database.db, { ADMIN_RECOVERY_EMAIL: email, ADMIN_RECOVERY_PASSWORD: replacement })).rejects.toThrow();
    await database.db.update(user).set({ banned: true }).where(eq(user.id, adminId));
    await expect(recoverAdminPassword(database.db, { ADMIN_RECOVERY_EMAIL: "owner@example.test", ADMIN_RECOVERY_PASSWORD: replacement })).rejects.toThrow();
    expect((await database.db.select().from(user).where(eq(user.id, adminId)))[0].banned).toBe(true);
    await database.db.update(user).set({ banned: false }).where(eq(user.id, adminId));
    await database.db.delete(account).where(and(eq(account.userId, adminId), eq(account.providerId, "credential")));
    await expect(recoverAdminPassword(database.db, { ADMIN_RECOVERY_EMAIL: "owner@example.test", ADMIN_RECOVERY_PASSWORD: replacement })).rejects.toThrow();
    expect(await database.db.select().from(user)).toHaveLength(2);
    expect(await database.db.select().from(session)).toHaveLength(2);
  });
});
