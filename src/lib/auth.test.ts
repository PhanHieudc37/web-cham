import { describe, expect, it } from "vitest";
import { hasRole, safeAdminNext } from "./auth";
import { changePasswordSchema, createUserSchema } from "./validation/auth";

describe("admin roles and redirects", () => {
  it("requires exact roles and never trusts comma-separated or unknown role values", () => {
    expect(hasRole("admin", "admin")).toBe(true); expect(hasRole("admin", "staff")).toBe(true); expect(hasRole("staff", "staff")).toBe(true);
    for (const role of [null, undefined, "user", "staff", "admin,user", "ADMIN"]) expect(hasRole(role, "admin")).toBe(false);
  });
  it.each(["https://example.test", "//example.test", "/administrator", "/admin\\evil", "/admin/%2f%2fexample.test", "/admin/login", "/admin/../evil", "/admin/%2e%2e/evil", " /admin", undefined, ["/admin/users"]])("rejects unsafe redirect %j", (value) => expect(safeAdminNext(value)).toBe("/admin"));
  it("accepts only internal admin routes and retains query strings", () => {
    expect(safeAdminNext("/admin/users?page=2")).toBe("/admin/users?page=2");
    expect(safeAdminNext("/admin?tab=one")).toBe("/admin?tab=one");
  });
  it("validates account roles, password lengths, confirmation, and unchanged passwords", () => {
    expect(createUserSchema.safeParse({ name: "Nhân viên", email: "staff@example.test", password: "short", role: "staff" }).success).toBe(false);
    expect(createUserSchema.safeParse({ name: "Nhân viên", email: "staff@example.test", password: "long-password", role: "user" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "old-password", newPassword: "new-password", confirmPassword: "different" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "old-password", newPassword: "old-password", confirmPassword: "old-password" }).success).toBe(false);
  });
});
