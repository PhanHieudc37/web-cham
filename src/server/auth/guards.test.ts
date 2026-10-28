import "server-only";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), findUser: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("./auth", () => ({ getAuth: () => ({ api: { getSession: mocks.getSession } }) }));
vi.mock("@/server/db/client", () => ({ getDatabase: () => ({ select: () => ({ from: () => ({ where: mocks.findUser }) }) }) }));
import { getSessionUser, requireRole, requireRolePage } from "./guards";
import { createUserAction, setUserBanAction, setUserRoleAction, resetUserPasswordAction } from "@/server/actions/admin/users";
import { updateSettingsAction } from "@/server/actions/admin/settings";
import { defaultSettings } from "@/lib/validation/settings";

describe("authoritative guards and direct action calls", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getSession.mockResolvedValue({ user: { id: "staff-id", role: "admin" } }); mocks.findUser.mockResolvedValue([{ id: "staff-id", name: "Nhân viên", email: "staff@example.test", role: "staff", banned: false }]); });
  it("uses the database role even when session data claims admin", async () => {
    expect(await getSessionUser()).toMatchObject({ role: "staff" });
    await expect(requireRole("admin")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await requireRole("staff")).toMatchObject({ id: "staff-id" });
  });
  it("rejects missing, banned, deleted, and non-management accounts", async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(requireRole("staff")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    mocks.getSession.mockResolvedValue({ user: { id: "staff-id" } });
    for (const values of [[], [{ id: "staff-id", role: "admin", banned: true }], [{ id: "staff-id", role: "user", banned: false }]]) {
      mocks.findUser.mockResolvedValue(values); expect(await getSessionUser()).toBeNull();
    }
  });
  it("redirects unauthenticated pages to login and staff-only restrictions to forbidden", async () => {
    await expect(requireRolePage("admin", "/admin/users")).rejects.toThrow("REDIRECT:/admin/forbidden");
    mocks.getSession.mockResolvedValue(null);
    await expect(requireRolePage("staff", "/admin/users")).rejects.toThrow("REDIRECT:/admin/login?next=%2Fadmin%2Fusers");
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
});
