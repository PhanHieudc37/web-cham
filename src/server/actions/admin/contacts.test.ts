import "server-only";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), handle: vi.fn() }));
vi.mock("@/server/auth/guards", () => ({ requireRole: mocks.guard }));
vi.mock("@/server/services/contact.service", () => ({ getContactService: () => ({ markHandled: mocks.handle }) }));
import { AppError } from "@/server/errors";
import { markContactHandledAction } from "./contacts";
const id = "00000000-0000-4000-8000-000000000011";
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ id: "staff" }); mocks.handle.mockResolvedValue({ id }); });
it("validates first and denies direct unauthorized calls", async () => {
  expect(await markContactHandledAction({ id: "bad" })).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } }); expect(mocks.guard).not.toHaveBeenCalled();
  mocks.guard.mockRejectedValue(new AppError("UNAUTHORIZED")); expect(await markContactHandledAction({ id })).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } }); expect(mocks.handle).not.toHaveBeenCalled();
});
it("uses the authenticated staff ID as the handler, ignoring client supplied actor fields", async () => {
  expect(await markContactHandledAction({ id, actorId: "forged" })).toEqual({ ok: true, data: { id } }); expect(mocks.guard).toHaveBeenCalledWith("staff"); expect(mocks.handle).toHaveBeenCalledWith(id, "staff");
});
