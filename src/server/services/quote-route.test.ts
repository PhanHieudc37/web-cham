import { beforeEach, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const mocked = vi.hoisted(() => ({ limit: vi.fn(), quote: vi.fn() }));
vi.mock("@/server/rate-limit", () => ({ rateLimit: mocked.limit }));
vi.mock("@/server/request", () => ({ getClientIp: async () => "127.0.0.1" }));
vi.mock("./cart.service", () => ({ quoteCart: mocked.quote }));
import { POST } from "@/app/api/cart/quote/route";
const request = (body: unknown) => new Request("https://shop.example/api/cart/quote", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => vi.clearAllMocks());

it("validates before starting rate-limit or quote reads", async () => {
  expect((await POST(request({ lines: [{ quantity: -1 }] }))).status).toBe(400);
  expect(mocked.limit).not.toHaveBeenCalled(); expect(mocked.quote).not.toHaveBeenCalled();
});
it("starts both reads together and gives a later rate-limit rejection precedence", async () => {
  let rejectLimit: (reason: Error) => void = () => { throw new Error("Limit not started"); };
  mocked.limit.mockImplementation(() => new Promise<void>((_, reject) => { rejectLimit = reject; }));
  mocked.quote.mockRejectedValue(new AppError("OUT_OF_STOCK"));
  const responsePromise = POST(request({ lines: [] }));
  await vi.waitFor(() => expect(mocked.quote).toHaveBeenCalled());
  rejectLimit(new AppError("RATE_LIMITED"));
  const response = await responsePromise;
  expect(response.status).toBe(429); expect(await response.json()).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
});
it("returns the server quote without caching when permitted", async () => {
  mocked.limit.mockResolvedValue(undefined); mocked.quote.mockResolvedValue({ lines: [], total: 0 });
  const response = await POST(request({ lines: [] }));
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ ok: true, data: { lines: [], total: 0 } });
});
