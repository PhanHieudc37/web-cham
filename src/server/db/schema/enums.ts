import "server-only";

import { pgEnum } from "drizzle-orm/pg-core";

export const productStatus = pgEnum("product_status", ["draft", "active", "archived"]);
export const orderStatus = pgEnum("order_status", ["pending", "confirmed", "shipping", "completed", "cancelled", "returned"]);
export const paymentMethod = pgEnum("payment_method", ["cod", "bank_transfer"]);
export const paymentStatus = pgEnum("payment_status", ["unpaid", "paid", "refunded"]);
export const stockReason = pgEnum("stock_reason", ["order", "cancel", "return", "manual", "import"]);
export const orderEventType = pgEnum("order_event_type", ["created", "status_changed", "payment_updated", "shipping_updated", "note"]);
export const contactStatus = pgEnum("contact_status", ["new", "handled"]);
