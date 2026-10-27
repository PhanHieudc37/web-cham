import "server-only";

import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { productStatus } from "./enums";
import { createdAt, primaryId, timestamps } from "./shared";

export const categories = pgTable("categories", {
  id: primaryId(), parentId: uuid(), name: text().notNull(), slug: text().notNull().unique(),
  imageUrl: text(), imagePath: text(), sortOrder: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(), ...timestamps(),
}, (table) => [foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete("restrict")]).enableRLS();

export const sizeCharts = pgTable("size_charts", {
  id: primaryId(), name: text().notNull(), columns: jsonb().$type<string[]>().notNull(),
  rows: jsonb().$type<string[][]>().notNull(), note: text(), ...timestamps(),
}).enableRLS();

export const products = pgTable("products", {
  id: primaryId(), code: text().notNull().unique(), slug: text().notNull().unique(), name: text().notNull(),
  categoryId: uuid().notNull().references(() => categories.id, { onDelete: "restrict" }),
  status: productStatus().default("draft").notNull(), price: integer().notNull(), compareAtPrice: integer(),
  description: text().default("").notNull(), material: text(), fit: text(), care: text().array().default(sql`'{}'::text[]`).notNull(),
  sizeChartId: uuid().references(() => sizeCharts.id, { onDelete: "set null" }),
  isNew: boolean().default(false).notNull(), isBestSeller: boolean().default(false).notNull(),
  sortOrder: integer().default(0).notNull(), soldCount: integer().default(0).notNull(), searchText: text().notNull(),
  seoTitle: text(), seoDescription: text(), publishedAt: timestamp({ withTimezone: true }), ...timestamps(),
}, (table) => [
  check("products_price_positive", sql`${table.price} > 0`),
  check("products_compare_price_valid", sql`${table.compareAtPrice} IS NULL OR ${table.compareAtPrice} > ${table.price}`),
  index("products_status_category_idx").on(table.status, table.categoryId),
  index("products_status_published_idx").on(table.status, table.publishedAt.desc()),
  index("products_search_trgm_idx").using("gin", table.searchText.op("gin_trgm_ops")),
]).enableRLS();

export const productColors = pgTable("product_colors", {
  id: primaryId(), productId: uuid().notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text().notNull(), code: text().notNull(), hex: text().notNull(), sortOrder: integer().default(0).notNull(),
}, (table) => [unique().on(table.productId, table.code)]).enableRLS();

export const productImages = pgTable("product_images", {
  id: primaryId(), productId: uuid().notNull().references(() => products.id, { onDelete: "cascade" }),
  colorId: uuid().references(() => productColors.id, { onDelete: "set null" }),
  url: text().notNull(), storagePath: text().notNull(), alt: text().default("").notNull(),
  sortOrder: integer().default(0).notNull(), createdAt: createdAt(),
}).enableRLS();

export const productVariants = pgTable("product_variants", {
  id: primaryId(), productId: uuid().notNull().references(() => products.id, { onDelete: "cascade" }),
  colorId: uuid().notNull().references(() => productColors.id, { onDelete: "cascade" }),
  size: text().notNull(), sku: text().unique().notNull(), stock: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(), ...timestamps(),
}, (table) => [unique().on(table.productId, table.colorId, table.size), check("product_variants_stock_nonnegative", sql`${table.stock} >= 0`)]).enableRLS();
