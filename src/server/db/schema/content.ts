import "server-only";

import { boolean, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "./catalog";
import { primaryId, timestamps } from "./shared";

export const collections = pgTable("collections", {
  id: primaryId(), slug: text().notNull().unique(), title: text().notNull(), description: text(),
  bannerUrl: text(), bannerPath: text(), isActive: boolean().default(true).notNull(),
  showOnHome: boolean().default(false).notNull(), showInMenu: boolean().default(false).notNull(),
  sortOrder: integer().default(0).notNull(), ...timestamps(),
}).enableRLS();

export const collectionProducts = pgTable("collection_products", {
  collectionId: uuid().notNull().references(() => collections.id, { onDelete: "cascade" }),
  productId: uuid().notNull().references(() => products.id, { onDelete: "cascade" }),
  sortOrder: integer().default(0).notNull(),
}, (table) => [primaryKey({ columns: [table.collectionId, table.productId] })]).enableRLS();

export const banners = pgTable("banners", {
  id: primaryId(), title: text().notNull(), desktopImageUrl: text().notNull(), desktopImagePath: text().notNull(),
  mobileImageUrl: text().notNull(), mobileImagePath: text().notNull(), alt: text().notNull(), href: text().notNull(),
  ctaLabel: text().default("MUA NGAY").notNull(), sortOrder: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(), startsAt: timestamp({ withTimezone: true }), endsAt: timestamp({ withTimezone: true }), ...timestamps(),
}).enableRLS();
