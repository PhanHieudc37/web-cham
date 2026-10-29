import "server-only";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ submit: vi.fn(), notify: vi.fn(), callbacks: [] as (() => Promise<void>)[] }));
vi.mock("next/server", () => ({ after: (callback: () => Promise<void>) => mocks.callbacks.push(callback) }));
vi.mock("@/server/request", () => ({ getClientIp: async () => "198.51.100.11" }));
vi.mock("@/server/services/contact.service", () => ({ getContactService: () => ({ submit: mocks.submit }) }));
vi.mock("@/server/services/settings.service", () => ({ getPublicSettings: async () => ({ shop: { name: "Cham.stu" } }) }));
vi.mock("@/server/services/notification.service", () => ({ notifyNewContact: mocks.notify }));
import { AppError } from "@/server/errors";
import { submitContactAction } from "./contact";
const input = { name: "Khách thử", phone: "0912345678", message: "Tư vấn giúp tôi chọn size" };
beforeEach(() => { vi.clearAllMocks(); mocks.callbacks.length = 0; mocks.submit.mockResolvedValue({ id: "message-id" }); });
it("validates direct contact calls before the public service", async () => { expect(await submitContactAction({})).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } }); expect(mocks.submit).not.toHaveBeenCalled(); });
it("returns null and notifies the shop only after the message has been persisted", async () => {
  expect(await submitContactAction(input)).toEqual({ ok: true, data: null }); expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining(input), "198.51.100.11"); expect(mocks.notify).not.toHaveBeenCalled();
  await mocks.callbacks[0](); expect(mocks.notify).toHaveBeenCalledWith({ id: "message-id" }, "Cham.stu");
});
it("does not notify for honeypots or rate limited requests", async () => {
  mocks.submit.mockResolvedValue(null); expect(await submitContactAction({ ...input, website: "bot" })).toEqual({ ok: true, data: null }); expect(mocks.callbacks).toHaveLength(0);
  mocks.submit.mockRejectedValue(new AppError("RATE_LIMITED")); expect(await submitContactAction(input)).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } }); expect(mocks.callbacks).toHaveLength(0);
});
