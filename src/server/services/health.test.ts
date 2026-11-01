import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ execute: vi.fn(), get: vi.fn() }));
vi.mock("@/server/db/client", () => ({ getDatabase: database.get }));
import { GET } from "@/app/api/health/route";

describe("public health probe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.get.mockReturnValue({ execute: database.execute });
    database.execute.mockResolvedValue([{ "?column?": 1 }]);
    vi.stubEnv("APP_COMMIT_REF", "a".repeat(40));
  });
  afterEach(() => vi.unstubAllEnvs());
  it("returns a build identifier without connecting to the database by default", async () => {
    const response = await GET(new Request("https://shop.example/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true, commit: "a".repeat(40), dbMs: null });
    expect(database.get).not.toHaveBeenCalled();
  });
  it("executes one read-only query only for db=1 and reports a finite duration", async () => {
    const response = await GET(new Request("https://shop.example/api/health?db=1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, commit: "a".repeat(40), dbMs: expect.any(Number) });
    expect(database.execute).toHaveBeenCalledTimes(1);
  });
  it("validates unknown, invalid and duplicate parameters before initializing the database", async () => {
    for (const query of ["db=0", "db=1&db=1", "token=hidden"]) {
      const response = await GET(new Request(`https://shop.example/api/health?${query}`));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ ok: false, commit: "a".repeat(40), dbMs: null });
    }
    expect(database.get).not.toHaveBeenCalled();
  });
  it("returns 503 on a database failure without exposing exception details", async () => {
    database.execute.mockRejectedValue(new Error("database-password-must-not-escape"));
    const response = await GET(new Request("https://shop.example/api/health?db=1"));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: false, commit: "a".repeat(40), dbMs: null });
  });
});
