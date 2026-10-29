import "server-only";

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { contactFiltersSchema, contactSchema } from "@/lib/validation/contact";
import { createDatabase } from "@/server/db/client";
import { contactMessages, rateLimits, sizeCharts, user } from "@/server/db/schema";
import { createContactService } from "./contact.service";
import { readSizeCharts } from "./information.service";

const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("contact messages on isolated PostgreSQL", () => {
  let database: ReturnType<typeof createDatabase>;
  let service: ReturnType<typeof createContactService>;
  const actor = "phase11-actor", secondActor = "phase11-second";
  const input = () => contactSchema.parse({ name: "  Khách thử  ", phone: "+84 912345678", message: "Tư vấn giúp tôi chọn size áo", email: "customer@example.test" });
  beforeAll(async () => {
    if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Chỉ dùng database _test");
    for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) if (new URL(other).host === new URL(url).host && new URL(other).pathname === new URL(url).pathname) throw new Error("Không dùng database dev/prod");
    database = createDatabase(url); await migrate(database.db, { migrationsFolder: "src/server/db/migrations" }); service = createContactService(database.db);
    await database.db.insert(user).values([{ id: actor, name: "Người xử lý đầu", email: "phase11-first@example.test", role: "staff" }, { id: secondActor, name: "Người xử lý sau", email: "phase11-second@example.test", role: "staff" }]).onConflictDoNothing();
  }, 60000);
  beforeEach(async () => { await database.db.execute(sql`TRUNCATE contact_messages, rate_limits CASCADE`); });
  afterAll(async () => { if (database) { await database.db.delete(user).where(eq(user.id, actor)); await database.db.delete(user).where(eq(user.id, secondActor)); await database.connection.end(); } });
  it("persists valid messages with IP, but exposes no IP in admin DTOs", async () => {
    const message = await service.submit(input(), "198.51.100.11");
    expect(message).toMatchObject({ name: "Khách thử", phone: "0912345678", status: "new" }); expect(message).not.toHaveProperty("ip");
    const list = await service.list(contactFiltersSchema.parse({})); expect(list.total).toBe(1); expect(list.items[0]).not.toHaveProperty("ip");
    expect((await database.db.select().from(contactMessages))[0].ip).toBe("198.51.100.11");
  });
  it("honors the honeypot without recording a message, while consuming the quota", async () => {
    expect(await service.submit({ ...input(), website: "bot" }, "198.51.100.12")).toBeNull();
    expect((await database.db.select().from(contactMessages))).toHaveLength(0);
    expect((await database.db.select().from(rateLimits))[0].count).toBe(1);
  });
  it("atomically limits concurrent contact requests to three per IP per ten minutes", async () => {
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => service.submit(input(), "198.51.100.13")));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
    expect(results.filter((result) => result.status === "rejected")).toEqual([expect.objectContaining({ reason: expect.objectContaining({ code: "RATE_LIMITED" }) }), expect.objectContaining({ reason: expect.objectContaining({ code: "RATE_LIMITED" }) })]);
    expect(await database.db.select().from(contactMessages)).toHaveLength(3);
    await database.db.update(rateLimits).set({ resetAt: new Date(0) }).where(eq(rateLimits.key, "contact:198.51.100.13"));
    expect(await service.submit(input(), "198.51.100.13")).not.toBeNull();
  });
  it("records the first handler and time, preserving them on retries and concurrent handling", async () => {
    const message = await service.submit(input(), "198.51.100.14"); if (!message) throw new Error("Thiếu tin nhắn");
    await Promise.all([service.markHandled(message.id, actor), service.markHandled(message.id, actor)]);
    const first = (await service.list(contactFiltersSchema.parse({ status: "handled" }))).items[0];
    expect(first).toMatchObject({ handledByName: "Người xử lý đầu", status: "handled" }); expect(first.handledAt).toBeTruthy();
    await service.markHandled(message.id, secondActor);
    expect((await service.list(contactFiltersSchema.parse({ status: "handled" }))).items[0]).toEqual(first);
    expect((await service.list(contactFiltersSchema.parse({}))).counts).toEqual({ new: 0, handled: 1 });
    await expect(service.markHandled(randomUUID(), actor)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("paginates messages twenty at a time and returns all current size charts as DTOs", async () => {
    await database.db.insert(contactMessages).values(Array.from({ length: 23 }, (_, index) => ({ name: `Khách ${index}`, phone: "0912345678", message: "Tin nhắn kiểm thử phân trang", status: index < 2 ? "handled" as const : "new" as const })));
    expect((await service.list(contactFiltersSchema.parse({}))).items).toHaveLength(20);
    expect((await service.list(contactFiltersSchema.parse({ page: 500 }))).items).toHaveLength(1);
    const id = randomUUID(); await database.db.insert(sizeCharts).values({ id, name: "Bảng size thử Phase 11", columns: ["Size", "Ngực"], rows: [["M", "50"]], note: "Đo ngang" });
    try { expect(await readSizeCharts(database.db)).toEqual(expect.arrayContaining([expect.objectContaining({ id, name: "Bảng size thử Phase 11", columns: ["Size", "Ngực"], rows: [["M", "50"]] })])); }
    finally { await database.db.delete(sizeCharts).where(eq(sizeCharts.id, id)); }
  });
});
