import "server-only";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), status: vi.fn(), paid: vi.fn(), refund: vi.fn(), shipping: vi.fn(), note: vi.fn(), detail: vi.fn(), notify: vi.fn(), invalidate: vi.fn(), callbacks: [] as (() => Promise<void>)[] }));
vi.mock("next/server", () => ({ after: (callback: () => Promise<void>) => mocks.callbacks.push(callback) }));
vi.mock("@/server/auth/guards", () => ({ requireRole: mocks.guard }));
vi.mock("@/server/cache", () => ({ CACHE_TAGS: { products: "products" }, invalidate: mocks.invalidate }));
vi.mock("@/server/services/order.service", () => ({ getOrderService: () => ({ updateStatus: mocks.status, markPaid: mocks.paid, markRefunded: mocks.refund, updateShipping: mocks.shipping, addNote: mocks.note, getAdminDetail: mocks.detail }) }));
vi.mock("@/server/services/settings.service", () => ({ getPublicSettings: async () => ({ shop: { name: "Cham.stu" } }) }));
vi.mock("@/server/services/notification.service", () => ({ notifyOrderShipped: mocks.notify }));
import { AppError } from "@/server/errors";
import { addOrderNoteAction, changeOrderPaymentAction, changeOrderStatusAction, saveOrderShippingAction } from "./orders";
const orderId = "00000000-0000-4000-8000-000000000010";
beforeEach(() => { vi.clearAllMocks(); mocks.callbacks.length = 0; mocks.guard.mockResolvedValue({ id: "staff", role: "staff" }); mocks.status.mockResolvedValue({ orderId }); mocks.detail.mockResolvedValue({ id: orderId, trackingCode: "TRACK", customerEmail: "customer@example.test" }); });
it("validates before checking staff permissions and never calls services for denied users", async () => {
  expect(await changeOrderStatusAction({ orderId, toStatus: "cancelled", reason: "" })).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } }); expect(mocks.guard).not.toHaveBeenCalled();
  mocks.guard.mockRejectedValue(new AppError("UNAUTHORIZED"));
  for (const result of [await changeOrderStatusAction({ orderId, toStatus: "confirmed" }), await changeOrderPaymentAction({ orderId, paymentStatus: "paid" }), await saveOrderShippingAction({ orderId }), await addOrderNoteAction({ orderId, message: "Ghi chú" })]) expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  for (const mock of [mocks.status, mocks.paid, mocks.shipping, mocks.note]) expect(mock).not.toHaveBeenCalled();
});
it("schedules shipping email only after a successful committed transition with tracking/email", async () => {
  expect((await changeOrderStatusAction({ orderId, toStatus: "shipping", carrier: "GHN", trackingCode: "TRACK" })).ok).toBe(true);
  expect(mocks.guard).toHaveBeenCalledWith("staff"); expect(mocks.notify).not.toHaveBeenCalled(); expect(mocks.callbacks).toHaveLength(1);
  await mocks.callbacks[0](); expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ trackingCode: "TRACK" }), "Cham.stu");
  mocks.callbacks.length = 0; mocks.status.mockRejectedValue(new AppError("INVALID_TRANSITION"));
  expect((await changeOrderStatusAction({ orderId, toStatus: "shipping" })).ok).toBe(false); expect(mocks.callbacks).toHaveLength(0);
});
it("does not notify for ordinary shipping edits or missing customer email", async () => {
  await saveOrderShippingAction({ orderId, carrier: "GHN", trackingCode: "EDIT" }); expect(mocks.callbacks).toHaveLength(0);
  mocks.detail.mockResolvedValue({ id: orderId, trackingCode: "TRACK", customerEmail: null });
  await changeOrderStatusAction({ orderId, toStatus: "shipping" }); expect(mocks.callbacks).toHaveLength(0);
});
