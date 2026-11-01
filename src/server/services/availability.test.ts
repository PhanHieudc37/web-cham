import { beforeEach, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";
const mocked = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("./availability.service", () => ({ getProductAvailability: mocked.read }));
import { GET } from "@/app/api/products/[id]/availability/route";

const id = "00000000-0000-4000-8000-000000000015";
beforeEach(() => vi.clearAllMocks());
it("validates product UUID before reading anything", async () => {
  const response = await GET(new Request("https://shop.example/api/products/invalid/availability"), { params: Promise.resolve({ id: "invalid" }) });
  expect(response.status).toBe(400); expect(mocked.read).not.toHaveBeenCalled(); expect(response.headers.get("cache-control")).toBe("no-store");
});
it("returns fresh public DTOs without requiring a session or shared cache", async () => {
  mocked.read.mockResolvedValue({ price: 100000, variants: [], isSoldOut: true });
  const response = await GET(new Request(`https://shop.example/api/products/${id}/availability`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ ok: true, data: { price: 100000, variants: [], isSoldOut: true } });
  expect(mocked.read).toHaveBeenCalledWith(id);
});
it("does not expose hidden or missing products", async () => {
  mocked.read.mockRejectedValue(new AppError("NOT_FOUND"));
  const response = await GET(new Request(`https://shop.example/api/products/${id}/availability`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(404); expect(await response.json()).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
});
