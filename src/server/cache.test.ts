import { afterEach, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => [] as string[][]);
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>, keys: string[]) => { captured.push(keys); return fn; } }));
import { cached } from "./cache";

afterEach(() => { vi.unstubAllEnvs(); captured.length = 0; });
it("isolates persisted public data by database and pooler project", async () => {
  const read = cached(async () => "public-data", ["home"], ["products"]);
  for (const url of ["postgresql://project_a:private@localhost:5432/shop", "postgresql://project_a:private@localhost:5432/shop_test", "postgresql://project_b:private@localhost:5432/shop"]) {
    vi.stubEnv("DATABASE_URL", url); expect(await read()).toBe("public-data");
  }
  expect(new Set(captured.map(([namespace]) => namespace)).size).toBe(3);
  expect(JSON.stringify(captured)).not.toMatch(/private|project_a|project_b/);
});
it("keeps cache identity stable when only the database password rotates", async () => {
  const read = cached(async () => null, ["home"], ["products"]);
  vi.stubEnv("DATABASE_URL", "postgresql://project_a:first@localhost:5432/shop"); await read();
  vi.stubEnv("DATABASE_URL", "postgresql://project_a:second@localhost:5432/shop"); await read();
  expect(captured[0]).toEqual(captured[1]);
});
