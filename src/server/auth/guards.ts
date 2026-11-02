import "server-only";

import { cache } from "react";
import { getSessionCookie } from "better-auth/cookies";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasRole, safeAdminNext, type AdminRole, type SessionUserDTO } from "@/lib/auth";
import { AppError } from "@/server/errors";
import { getAuth } from "./auth";

export const getSessionUser = cache(async (): Promise<SessionUserDTO | null> => {
  const requestHeaders = new Headers(await headers());
  // A Server Action can rotate the session cookie (for example on password
  // change). The mutable cookie store is newer than the original HTTP headers.
  requestHeaders.set("cookie", (await cookies()).toString());
  // Anonymous login visits need no auth/database initialization. A cookie is
  // only a hint here; Better Auth validates it against a fresh session/user join.
  if (!getSessionCookie(requestHeaders)) return null;
  const session = await getAuth().api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
  if (!session) return null;
  // Native joins in Better Auth 1.7.14 read this user from the database on every
  // request. Cookie cache and secondary storage are disabled in auth.ts.
  const person = session.user;
  if (!person || person.banned || !hasRole(person.role, "staff")) return null;
  return { id: person.id, name: person.name, email: person.email, role: person.role };
});
export async function requireRole(minimum: AdminRole): Promise<SessionUserDTO> {
  const person = await getSessionUser();
  if (!person) throw new AppError("UNAUTHORIZED");
  if (!hasRole(person.role, minimum)) throw new AppError("FORBIDDEN");
  return person;
}
export async function requireRolePage(minimum: AdminRole, next = "/admin"): Promise<SessionUserDTO> {
  const person = await getSessionUser();
  if (!person) redirect(`/admin/login?next=${encodeURIComponent(safeAdminNext(next))}`);
  if (!hasRole(person.role, minimum)) redirect("/admin/forbidden");
  return person;
}

export async function readAuthorizedPage<T>(minimum: AdminRole, next: string, read: () => Promise<T>) {
  // Reads may overlap authorization, but neither their data nor their errors may
  // render until the guard succeeds. Mutating actions still authorize first.
  const resultPromise = read().then((value) => ({ ok: true as const, value }), (error: unknown) => ({ ok: false as const, error }));
  const [person, result] = await Promise.all([requireRolePage(minimum, next), resultPromise]);
  if (!result.ok) {
    if (result.error instanceof AppError) throw result.error;
    // Database errors can include bound customer filters. Do not forward them
    // to Next's error logger or the rendered error boundary.
    throw new Error("Không thể tải dữ liệu quản trị. Vui lòng thử lại.");
  }
  return { person, data: result.value };
}
