import "server-only";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("@/server/request", () => ({ getClientIp: async () => "198.51.100.11" }));
vi.mock("@/server/services/order.service", () => ({ getOrderService: () => ({ lookupPublic: mocks.lookup }) }));
import { AppError } from "@/server/errors";
import { lookupOrderAction } from "./order-lookup";
beforeEach(() => { vi.clearAllMocks(); });
it("validates and normalizes lookup credentials before invoking the rate limited service", async () => {
  expect(await lookupOrderAction({})).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } }); expect(mocks.lookup).not.toHaveBeenCalled();
  mocks.lookup.mockResolvedValue({ code: "CS1234", customerPhone: "0912***678" });
  expect(await lookupOrderAction({ code: "cs1234", phone: "+84912345678" })).toMatchObject({ ok: true, data: { customerPhone: "0912***678" } }); expect(mocks.lookup).toHaveBeenCalledWith({ code: "CS1234", phone: "0912345678", website: "" }, "198.51.100.11");
});
it("preserves the generic not-found message and RATE_LIMITED code", async () => {
  for (const code of ["NOT_FOUND", "RATE_LIMITED"] as const) { mocks.lookup.mockRejectedValue(new AppError(code, code === "NOT_FOUND" ? "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại." : undefined)); expect(await lookupOrderAction({ code: "CS1234", phone: "0912345678" })).toMatchObject({ ok: false, error: { code } }); }
});
