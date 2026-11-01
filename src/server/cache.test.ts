import { afterEach, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => [] as string[][]);
const controls = vi.hoisted(() => ({ ttls: [] as number[], callbacks: [] as (() => Promise<void>)[] }));
vi.mock("next/server", () => ({ after: (callback: () => Promise<void>) => controls.callbacks.push(callback) }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>, keys: string[], options: { revalidate: number }) => { captured.push(keys); controls.ttls.push(options.revalidate); return fn; } }));
import { cached, warmPaths } from "./cache";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); captured.length = 0; controls.ttls.length = 0; controls.callbacks.length = 0; });
it("isolates persisted public data by database and pooler project", async () => {
  const read = cached(async () => "public-data", ["home"], ["products"]);
  for (const url of ["postgresql://project_a:private@localhost:5432/shop", "postgresql://project_a:private@localhost:5432/shop_test", "postgresql://project_b:private@localhost:5432/shop"]) {
    vi.stubEnv("DATABASE_URL", url); expect(await read()).toBe("public-data");
  }
  expect(new Set(captured.map(([namespace]) => namespace)).size).toBe(3);
  expect(JSON.stringify(captured)).not.toMatch(/private|project_a|project_b/);
});
it("uses one-day public data expiry and permits one-hour scheduled banner expiry", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test:private@localhost:5432/shop_test");
  await cached(async () => null, ["catalog"], ["products"])();
  await cached(async () => null, ["home"], ["banners"], 3600)();
  expect(controls.ttls).toEqual([86400, 3600]);
});
it("warms only bounded public paths after the response and never forwards credentials", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example");
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response("ok")); vi.stubGlobal("fetch", fetch);
  warmPaths(["/admin/orders", "//other.example", "/checkout/success?t=private", "/products/valid", "/products/valid", ...Array.from({ length: 15 }, (_, index) => `/collections/item-${index}`)]);
  expect(fetch).not.toHaveBeenCalled(); expect(controls.callbacks).toHaveLength(1);
  await controls.callbacks[0](); expect(fetch).toHaveBeenCalledTimes(10);
  for (const call of fetch.mock.calls) { expect(String(call[0])).toMatch(/^https:\/\/shop\.example\/(products|collections)\//); expect(call[1]).not.toHaveProperty("headers"); }
});
it("keeps cache identity stable when only the database password rotates", async () => {
  const read = cached(async () => null, ["home"], ["products"]);
  vi.stubEnv("DATABASE_URL", "postgresql://project_a:first@localhost:5432/shop"); await read();
  vi.stubEnv("DATABASE_URL", "postgresql://project_a:second@localhost:5432/shop"); await read();
  expect(captured[0]).toEqual(captured[1]);
});
