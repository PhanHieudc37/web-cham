import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { hasRole, safeAdminNext, type AdminRole, type SessionUserDTO } from "@/lib/auth";
import { getDatabase } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { getAuth } from "./auth";

export const getSessionUser = cache(async (): Promise<SessionUserDTO | null> => {
  const session = await getAuth().api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) return null;
  const [person] = await getDatabase().select({ id: user.id, name: user.name, email: user.email, role: user.role, banned: user.banned }).from(user).where(eq(user.id, session.user.id));
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
