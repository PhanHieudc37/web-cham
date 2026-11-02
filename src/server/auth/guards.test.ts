import "server-only";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), unexpectedDatabaseRead: vi.fn(() => { throw new Error("Guard must use the fresh session join"); }), requestHeaders: vi.fn(), requestCookies: vi.fn() }));
vi.mock("next/headers", () => ({ headers: mocks.requestHeaders, cookies: mocks.requestCookies }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("./auth", () => ({ getAuth: () => ({ api: { getSession: mocks.getSession } }) }));
vi.mock("@/server/db/client", () => ({ getDatabase: mocks.unexpectedDatabaseRead }));
import { getSessionUser, requireRole, requireRolePage, readAuthorizedPage } from "./guards";
import { createUserAction, setUserBanAction, setUserRoleAction, resetUserPasswordAction } from "@/server/actions/admin/users";
import { updateSettingsAction } from "@/server/actions/admin/settings";
import { defaultSettings } from "@/lib/validation/settings";
import { deleteCollectionAction, deleteBannerAction, reorderContentAction, findCollectionProductsAction } from "@/server/actions/admin/content";

describe("authoritative guards and direct action calls", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requestHeaders.mockResolvedValue(new Headers({ cookie: "better-auth.session_token=test-session" })); mocks.requestCookies.mockImplementation(async () => { const value: Headers = await mocks.requestHeaders(); return { toString: () => value.get("cookie") ?? "" }; }); mocks.getSession.mockResolvedValue({ user: { id: "staff-id", name: "Nhân viên", email: "staff@example.test", role: "staff", banned: false } }); });
  it("skips session and database reads entirely for visitors without a session cookie", async () => {
    mocks.requestHeaders.mockResolvedValue(new Headers());
    expect(await getSessionUser()).toBeNull();
    expect(mocks.getSession).not.toHaveBeenCalled(); expect(mocks.unexpectedDatabaseRead).not.toHaveBeenCalled();
  });
  it("uses the fresh joined database user without a redundant read or cookie cache", async () => {
    expect(await getSessionUser()).toMatchObject({ role: "staff" });
    await expect(requireRole("admin")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await requireRole("staff")).toMatchObject({ id: "staff-id" });
    expect(mocks.getSession).toHaveBeenCalledWith(expect.objectContaining({ query: { disableCookieCache: true } }));
    expect(mocks.unexpectedDatabaseRead).not.toHaveBeenCalled();
  });
  it("uses the rotated cookie store instead of stale incoming headers", async () => {
    mocks.requestCookies.mockResolvedValue({ toString: () => "better-auth.session_token=rotated-session" });
    await getSessionUser();
    const input = mocks.getSession.mock.calls[0][0] as { headers: Headers };
    expect(input.headers.get("cookie")).toBe("better-auth.session_token=rotated-session");
  });
  it("rejects missing, banned, deleted, and non-management accounts", async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(requireRole("staff")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    for (const person of [null, { id: "staff-id", role: "admin", banned: true }, { id: "staff-id", role: "user", banned: false }]) {
      mocks.getSession.mockResolvedValue({ user: person }); expect(await getSessionUser()).toBeNull();
    }
  });
  it("redirects unauthenticated pages to login and staff-only restrictions to forbidden", async () => {
    await expect(requireRolePage("admin", "/admin/users")).rejects.toThrow("REDIRECT:/admin/forbidden");
    mocks.getSession.mockResolvedValue(null);
    await expect(requireRolePage("staff", "/admin/users")).rejects.toThrow("REDIRECT:/admin/login?next=%2Fadmin%2Fusers");
  });
  it("discards parallel private read failures until authorization has succeeded", async () => {
    mocks.getSession.mockResolvedValue(null);
    const read = vi.fn(async () => { throw new Error("Private record must not be revealed"); });
    await expect(readAuthorizedPage("staff", "/admin/orders", read)).rejects.toThrow("REDIRECT:/admin/login?next=%2Fadmin%2Forders");
    expect(read).toHaveBeenCalledOnce();
  });
  it("does not forward database parameters in authorized page failures", async () => {
    await expect(readAuthorizedPage("staff", "/admin/orders", async () => { throw new Error("SQL with private customer filter"); })).rejects.toThrow("Không thể tải dữ liệu quản trị. Vui lòng thử lại.");
  });
  it("returns FORBIDDEN for every account/settings action called by staff", async () => {
    for (const result of await Promise.all([
      createUserAction({ name: "Tài khoản thử", email: "test@example.test", password: "strong-password", role: "admin" }),
      setUserRoleAction({ userId: "some-user", role: "admin" }), setUserBanAction({ userId: "some-user", banned: true }),
      resetUserPasswordAction({ userId: "some-user", newPassword: "strong-password" }), updateSettingsAction({ key: "shipping", value: defaultSettings.shipping }),
    ])) expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });
  it("validates before checking permissions and gives UNAUTHORIZED to anonymous calls", async () => {
    expect(await setUserRoleAction({ role: "admin" })).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
    mocks.getSession.mockResolvedValue(null);
    expect(await setUserBanAction({ userId: "some-user", banned: true })).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });
  it("protects all settings groups from staff and content mutations from anonymous requests", async () => {
    for (const [key, value] of Object.entries(defaultSettings)) expect(await updateSettingsAction({ key, value })).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    mocks.getSession.mockResolvedValue(null);
    const id = "087994d5-1cc2-49bd-aed8-d9873526d145";
    for (const result of await Promise.all([deleteCollectionAction({ id }), deleteBannerAction({ id }), reorderContentAction({ id, kind: "banners", direction: "up" }), findCollectionProductsAction({ query: "", page: 1 })])) expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });
});
