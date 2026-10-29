import "server-only";
import { randomUUID } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ place: vi.fn(), detail: vi.fn(), notify: vi.fn(), invalidate: vi.fn(), after: vi.fn(), settings: vi.fn() }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/server/request", () => ({ getClientIp: async () => "198.51.100.1" }));
vi.mock("@/server/cache", () => ({ CACHE_TAGS: { products: "products" }, invalidate: mocks.invalidate }));
vi.mock("@/server/services/order.service", () => ({ getOrderService: () => ({ placeOrderWithOutcome: mocks.place, getAdminDetail: mocks.detail }) }));
vi.mock("@/server/services/settings.service", () => ({ getPublicSettings: mocks.settings }));
vi.mock("@/server/services/notification.service", () => ({ notifyOrderCreated: mocks.notify }));
import { placeOrderAction } from "./checkout";

const input = () => ({ lines: [{ variantId: randomUUID(), quantity: 1 }], expectedTotal: 229000, idempotencyKey: randomUUID(), customerName: "Khách kiểm thử", customerPhone: "0912345678", province: "Hà Nội", ward: "Phường thử", addressLine: "Địa chỉ kiểm thử", paymentMethod: "cod", acceptedPolicies: true });
beforeEach(() => { vi.clearAllMocks(); mocks.place.mockResolvedValue({ placement: { orderCode: "CS2610281234", accessToken: "private-token" }, createdOrderId: "order-id" }); mocks.detail.mockResolvedValue({ id: "order-id" }); mocks.settings.mockResolvedValue({ shop: { name: "Cham.stu" } }); });
it("validates direct public calls before invoking the service", async () => { expect(await placeOrderAction({})).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } }); expect(mocks.place).not.toHaveBeenCalled(); expect(mocks.after).not.toHaveBeenCalled(); });
it("returns only placement data and schedules notifications after commit", async () => {
  expect(await placeOrderAction(input())).toEqual({ ok: true, data: { orderCode: "CS2610281234", accessToken: "private-token" } }); expect(mocks.invalidate).toHaveBeenCalledWith("products"); expect(mocks.notify).not.toHaveBeenCalled();
  const callback: () => Promise<void> = mocks.after.mock.calls[0][0]; await callback(); expect(mocks.notify).toHaveBeenCalledWith({ id: "order-id" }, "Cham.stu", "private-token");
});
it("does not schedule duplicate notification for an idempotent retry or honeypot", async () => { mocks.place.mockResolvedValue({ placement: { orderCode: "CS2610281234", accessToken: "private-token" }, createdOrderId: null }); expect(await placeOrderAction(input())).toMatchObject({ ok: true }); expect(mocks.after).not.toHaveBeenCalled(); expect(mocks.invalidate).not.toHaveBeenCalled(); });
