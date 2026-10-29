import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { ADMIN_PAGE_SIZE, PUBLIC_FORM_LIMITS } from "@/lib/constants";
import type { ContactInput, contactFiltersSchema } from "@/lib/validation/contact";
import type { ContactListDTO, ContactMessageDTO } from "@/types/contact";
import { getDatabase, type Database } from "@/server/db/client";
import { contactMessages, user } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";

const selection = { id: contactMessages.id, name: contactMessages.name, phone: contactMessages.phone, email: contactMessages.email, message: contactMessages.message, status: contactMessages.status, createdAt: contactMessages.createdAt, handledAt: contactMessages.handledAt, handledByName: user.name };
export function createContactService(db: Database) {
  async function submit(input: ContactInput, ip: string): Promise<ContactMessageDTO | null> {
    await rateLimit(`contact:${ip}`, PUBLIC_FORM_LIMITS.contact.requests, PUBLIC_FORM_LIMITS.contact.seconds, db);
    if (input.website) return null;
    const [message] = await db.insert(contactMessages).values({ name: input.name, phone: input.phone, email: input.email || null, message: input.message, ip }).returning({ id: contactMessages.id, createdAt: contactMessages.createdAt });
    return { id: message.id, name: input.name, phone: input.phone, email: input.email || null, message: input.message, status: "new", createdAt: message.createdAt.toISOString(), handledAt: null, handledByName: null };
  }
  async function list(input: z.output<typeof contactFiltersSchema>): Promise<ContactListDTO> {
    const grouped = await db.select({ status: contactMessages.status, count: count() }).from(contactMessages).groupBy(contactMessages.status);
    const counts = { new: grouped.find((row) => row.status === "new")?.count ?? 0, handled: grouped.find((row) => row.status === "handled")?.count ?? 0 };
    const total = counts[input.status], totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), page = Math.min(input.page, totalPages);
    const rows = await db.select(selection).from(contactMessages).leftJoin(user, eq(user.id, contactMessages.handledBy)).where(eq(contactMessages.status, input.status)).orderBy(desc(contactMessages.createdAt), desc(contactMessages.id)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
    return { items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), handledAt: row.handledAt?.toISOString() ?? null })), page, totalPages, total, counts };
  }
  async function markHandled(id: string, actorId: string) {
    // Only the first handler wins; retries preserve their identity and timestamp.
    const [updated] = await db.update(contactMessages).set({ status: "handled", handledAt: new Date(), handledBy: actorId }).where(and(eq(contactMessages.id, id), eq(contactMessages.status, "new"))).returning({ id: contactMessages.id });
    if (!updated) {
      const [existing] = await db.select({ id: contactMessages.id }).from(contactMessages).where(eq(contactMessages.id, id));
      if (!existing) throw new AppError("NOT_FOUND");
    }
    return { id };
  }
  return { submit, list, markHandled };
}
export function getContactService() { return createContactService(getDatabase()); }
