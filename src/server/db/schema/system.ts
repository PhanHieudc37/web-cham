import "server-only";

import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contactStatus } from "./enums";
import { createdAt, primaryId } from "./shared";

export const contactMessages = pgTable("contact_messages", {
  id: primaryId(), name: text().notNull(), phone: text().notNull(), email: text(), message: text().notNull(),
  status: contactStatus().default("new").notNull(), ip: text(), handledAt: timestamp({ withTimezone: true }),
  handledBy: text(), createdAt: createdAt(),
}).enableRLS();

export const settings = pgTable("settings", {
  key: text().primaryKey(), value: jsonb().$type<unknown>().notNull(), updatedAt: createdAt(), updatedBy: text(),
}).enableRLS();

export const rateLimits = pgTable("rate_limits", {
  key: text().primaryKey(), count: integer().notNull(), resetAt: timestamp({ withTimezone: true }).notNull(),
}).enableRLS();
