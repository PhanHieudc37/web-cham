export type AdminRole = "staff" | "admin";
export type SessionUserDTO = { id: string; name: string; email: string; role: AdminRole };
export const roleLabel = (role: AdminRole) => role === "admin" ? "Quản trị viên" : "Nhân viên";
export function hasRole(role: string | null | undefined, minimum: AdminRole): role is AdminRole {
  return role === "admin" || (minimum === "staff" && role === "staff");
}
export function safeAdminNext(value: unknown): string {
  if (typeof value !== "string" || !/^\/admin(?:\/|\?|$)/.test(value) || /[\\\x00-\x20]/.test(value)) return "/admin";
  try {
    const url = new URL(value, "https://local.invalid");
    if (url.origin !== "https://local.invalid" || !/^\/admin(?:\/|$)/.test(url.pathname) || url.pathname === "/admin/login" || /%2f|%5c|%2e/i.test(url.pathname)) return "/admin";
    return `${url.pathname}${url.search}`;
  } catch { return "/admin"; }
}
