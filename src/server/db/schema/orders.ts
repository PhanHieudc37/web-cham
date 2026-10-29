import "server-only";

import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products, productVariants } from "./catalog";
import { orderEventType, orderStatus, paymentMethod, paymentStatus, stockReason } from "./enums";
import { createdAt, primaryId, timestamps } from "./shared";

export const orders = pgTable("orders", {
  id: primaryId(), code: text().notNull().unique(), accessTokenHash: text().notNull(), idempotencyKey: text().notNull().unique(),
  status: orderStatus().default("pending").notNull(), paymentMethod: paymentMethod().notNull(), paymentStatus: paymentStatus().default("unpaid").notNull(),
  customerName: text().notNull(), customerPhone: text().notNull(), customerEmail: text(), province: text().notNull(), ward: text().notNull(),
  addressLine: text().notNull(), note: text(), subtotal: integer().notNull(), discountAmount: integer().default(0).notNull(),
  shippingFee: integer().notNull(), total: integer().notNull(), discountCode: text(), carrier: text(), trackingCode: text(), adminNote: text(), cancelReason: text(),
  customerId: text().references(() => user.id, { onDelete: "set null" }), ip: text(), ...timestamps(),
  confirmedAt: timestamp({ withTimezone: true }), shippedAt: timestamp({ withTimezone: true }), completedAt: timestamp({ withTimezone: true }),
  cancelledAt: timestamp({ withTimezone: true }), returnedAt: timestamp({ withTimezone: true }), paidAt: timestamp({ withTimezone: true }),
}, (table) => [
  index("orders_status_created_idx").on(table.status, table.createdAt.desc()),
  index("orders_customer_phone_idx").on(table.customerPhone), index("orders_created_idx").on(table.createdAt.desc()),
]).enableRLS();

export const orderItems = pgTable("order_items", {
  id: primaryId(), orderId: uuid().notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid().references(() => products.id, { onDelete: "set null" }),
  variantId: uuid().references(() => productVariants.id, { onDelete: "set null" }),
  productName: text().notNull(), productSlug: text().notNull(), colorName: text().notNull(), size: text().notNull(), sku: text().notNull(),
  imageUrl: text(), unitPrice: integer().notNull(), quantity: integer().notNull(), lineTotal: integer().notNull(),
}, (table) => [check("order_items_quantity_positive", sql`${table.quantity} > 0`), index("order_items_order_idx").on(table.orderId)]).enableRLS();

export const orderEvents = pgTable("order_events", {
  id: primaryId(), orderId: uuid().notNull().references(() => orders.id, { onDelete: "cascade" }), type: orderEventType().notNull(),
  fromStatus: orderStatus(), toStatus: orderStatus(), message: text(), actorId: text(), createdAt: createdAt(),
}, (table) => [index("order_events_order_created_idx").on(table.orderId, table.createdAt, table.id)]).enableRLS();

export const stockMovements = pgTable("stock_movements", {
  id: primaryId(), variantId: uuid().notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  delta: integer().notNull(), stockAfter: integer().notNull(), reason: stockReason().notNull(),
  orderId: uuid().references(() => orders.id, { onDelete: "set null" }), actorId: text(), note: text(), createdAt: createdAt(),
}, (table) => [index("stock_movements_variant_created_idx").on(table.variantId, table.createdAt.desc())]).enableRLS();
