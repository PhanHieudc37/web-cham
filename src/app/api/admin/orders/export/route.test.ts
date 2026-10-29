import "server-only";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), csv: vi.fn() }));
vi.mock("@/server/auth/guards", () => ({ requireRole: mocks.guard }));
vi.mock("@/server/services/order-admin.service", () => ({ getOrderAdminService: () => ({ exportCsv: mocks.csv }) }));
import { AppError } from "@/server/errors";
import { GET } from "./route";
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ role: "admin" }); mocks.csv.mockImplementation(async function* () { yield "\uFEFFheader\r\n"; yield "product\r\n"; }); });
it("rejects invalid filters before authorization, and denies anonymous/staff export", async () => {
  expect((await GET(new Request("http://localhost/api/admin/orders/export?page=-1"))).status).toBe(400); expect(mocks.guard).not.toHaveBeenCalled();
  for (const code of ["UNAUTHORIZED", "FORBIDDEN"] as const) { mocks.guard.mockRejectedValue(new AppError(code)); const response = await GET(new Request("http://localhost/api/admin/orders/export")); expect(response.status).toBe(code === "UNAUTHORIZED" ? 401 : 403); expect(await response.json()).toMatchObject({ ok: false, error: { code } }); }
  expect(mocks.csv).not.toHaveBeenCalled();
});
it("streams CSV privately and passes the exact current filters to the service", async () => {
  const response = await GET(new Request("http://localhost/api/admin/orders/export?status=shipping&q=CS10"));
  expect(mocks.guard).toHaveBeenCalledWith("admin"); expect(mocks.csv).toHaveBeenCalledWith(expect.objectContaining({ status: "shipping", q: "CS10" })); expect(response.headers.get("Cache-Control")).toBe("private, no-store"); expect(response.headers.get("Content-Type")).toContain("text/csv");
  const bytes = new Uint8Array(await response.arrayBuffer()); expect([...bytes.slice(0, 3)]).toEqual([239, 187, 191]); expect(new TextDecoder().decode(bytes)).toBe("header\r\nproduct\r\n");
});
