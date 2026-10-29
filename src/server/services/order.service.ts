import "server-only";

import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { z } from "zod";
import { canTransition, restoresStock } from "@/lib/domain/order-status";
import { maskPhone } from "@/lib/format";
import { checkoutSchema, orderLookupSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { orderStatusInputSchema } from "@/lib/validation/order-admin";
import { bankTransferEnabled } from "@/lib/validation/settings";
import type { OrderAdminDetailDTO, OrderPublicDTO, OrderSuccessDTO } from "@/types/dto";
import { getDatabase, type Database, type DatabaseReader } from "@/server/db/client";
import { orderEvents, orderItems, orders, products, productVariants, stockMovements } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";
import { buildCartQuote, loadCartRows } from "./cart.service";
import { readSettings } from "./settings.service";

type OrderRow = typeof orders.$inferSelect;
type Placement = { orderCode: string; accessToken: string };
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function createOrderCode(prefix: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", year: "2-digit", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${prefix}${part("year")}${part("month")}${part("day")}${randomInt(0, 10000).toString().padStart(4, "0")}`;
}

export function createOrderService(db: Database, secret: string) {
  if (secret.length < 32) throw new Error("Khóa tạo access token phải có ít nhất 32 ký tự");
  // A keyed token can be returned after a lost response without storing plaintext.
  const accessTokenFor = (order: Pick<OrderRow, "id" | "idempotencyKey">) => createHmac("sha256", secret).update(`order-access:v1:${order.id}:${order.idempotencyKey}`).digest("base64url");
  function placement(order: OrderRow): Placement {
    const accessToken = accessTokenFor(order);
    if (hashToken(accessToken) !== order.accessTokenHash) throw new AppError("CONFLICT", "Đơn đã được tạo. Vui lòng tra cứu bằng mã đơn và số điện thoại.", { orderCode: order.code });
    return { orderCode: order.code, accessToken };
  }

  async function placeOrderWithOutcome(raw: CheckoutInput, ip: string): Promise<{ placement: Placement; createdOrderId: string | null }> {
    await rateLimit(`order:${ip}`, 5, 600, db);
    if (raw.website) return { placement: { orderCode: createOrderCode("CS"), accessToken: randomBytes(32).toString("base64url") }, createdOrderId: null };
    const input = checkoutSchema.parse(raw);
    return db.transaction(async (tx) => {
      // Serialize requests for this key before inspecting the unique idempotency row.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${input.idempotencyKey}, 0))`);
      const [existing] = await tx.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey));
      if (existing) return { placement: placement(existing), createdOrderId: null };
      const rows = await loadCartRows(tx, input.lines.map((line) => line.variantId), true);
      const config = await readSettings(tx);
      const quote = await buildCartQuote(tx, input.lines, config, rows);
      const unavailable = quote.lines.filter((line) => line.issue !== null);
      if (unavailable.length) throw new AppError("OUT_OF_STOCK", undefined, unavailable.map((line) => ({ variantId: line.variantId, available: line.maxQuantity })));
      if (quote.total !== input.expectedTotal) throw new AppError("PRICE_CHANGED", undefined, quote);
      if (input.paymentMethod === "bank_transfer" && !bankTransferEnabled(config.bank)) throw new AppError("VALIDATION_ERROR", "Shop chưa bật thanh toán chuyển khoản.", undefined, { paymentMethod: "Vui lòng chọn thanh toán khi nhận hàng" });
      const id = randomUUID();
      const accessToken = accessTokenFor({ id, idempotencyKey: input.idempotencyKey });
      let order: OrderRow | undefined;
      for (let attempt = 0; attempt < 3 && !order; attempt++) {
        [order] = await tx.insert(orders).values({
          id, code: createOrderCode(config.orders.codePrefix), idempotencyKey: input.idempotencyKey, accessTokenHash: hashToken(accessToken),
          customerName: input.customerName, customerPhone: input.customerPhone, customerEmail: input.customerEmail || null,
          province: input.province, ward: input.ward, addressLine: input.addressLine, note: input.note || null, ip,
          paymentMethod: input.paymentMethod, subtotal: quote.subtotal, discountAmount: quote.discountAmount, shippingFee: quote.shippingFee, total: quote.total,
        }).onConflictDoNothing({ target: orders.code }).returning();
      }
      if (!order) throw new AppError("CONFLICT", "Chưa tạo được mã đơn. Vui lòng thử lại.");
      await tx.insert(orderItems).values(quote.lines.map((line) => {
        const row = rows.find((entry) => entry.variantId === line.variantId);
        if (!row) throw new AppError("OUT_OF_STOCK");
        return { orderId: id, productId: line.productId, variantId: line.variantId, productName: line.name, productSlug: line.slug, colorName: line.colorName,
          size: line.size, sku: row.sku, imageUrl: line.image?.url ?? null, unitPrice: line.unitPrice, quantity: line.quantity, lineTotal: line.lineTotal };
      }));
      // Use the same lock order for checkout, stock adjustments, and restoration.
      for (const row of rows) {
        const line = input.lines.find((entry) => entry.variantId === row.variantId);
        if (!line) throw new AppError("OUT_OF_STOCK");
        const [variant] = await tx.update(productVariants).set({ stock: sql`${productVariants.stock} - ${line.quantity}`, updatedAt: new Date() })
          .where(and(eq(productVariants.id, row.variantId), sql`${productVariants.stock} >= ${line.quantity}`)).returning({ stock: productVariants.stock });
        if (!variant) throw new AppError("OUT_OF_STOCK");
        await tx.insert(stockMovements).values({ variantId: row.variantId, delta: -line.quantity, stockAfter: variant.stock, reason: "order", orderId: id });
      }
      const quantities = new Map<string, number>();
      for (const line of quote.lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
      for (const [productId, quantity] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
        await tx.update(products).set({ soldCount: sql`${products.soldCount} + ${quantity}` }).where(eq(products.id, productId));
      }
      await tx.insert(orderEvents).values({ orderId: id, type: "created", toStatus: "pending" });
      return { placement: { orderCode: order.code, accessToken }, createdOrderId: id };
    });
  }
  async function placeOrder(raw: CheckoutInput, ip: string): Promise<Placement> {
    return (await placeOrderWithOutcome(raw, ip)).placement;
  }

  async function requireOrder(id: string, tx: DatabaseReader) {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!order) throw new AppError("NOT_FOUND");
    return order;
  }

  async function updateStatus(input: z.output<typeof orderStatusInputSchema>, actorId: string) {
    return db.transaction(async (tx) => {
      const order = await requireOrder(input.orderId, tx);
      if (!canTransition(order.status, input.toStatus)) throw new AppError("INVALID_TRANSITION");
      if (input.toStatus === "cancelled" && input.reason.trim().length < 2) throw new AppError("VALIDATION_ERROR", "Vui lòng nhập lý do hủy đơn.");
      const now = new Date();
      if (restoresStock(input.toStatus)) {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const variantIds = items.flatMap((item) => item.variantId ? [item.variantId] : []);
        if (variantIds.length) await tx.select({ id: productVariants.id }).from(productVariants).where(inArray(productVariants.id, variantIds)).orderBy(asc(productVariants.id)).for("update");
        for (const item of [...items].sort((a, b) => (a.variantId ?? "").localeCompare(b.variantId ?? ""))) {
          if (!item.variantId) continue;
          const [variant] = await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${item.quantity}`, updatedAt: now })
            .where(eq(productVariants.id, item.variantId)).returning({ stock: productVariants.stock });
          if (variant) await tx.insert(stockMovements).values({ variantId: item.variantId, delta: item.quantity, stockAfter: variant.stock, reason: input.toStatus === "cancelled" ? "cancel" : "return", orderId: order.id, actorId });
        }
        const quantities = new Map<string, number>();
        for (const item of items) if (item.productId) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
        for (const [productId, quantity] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
          await tx.update(products).set({ soldCount: sql`greatest(0, ${products.soldCount} - ${quantity})` }).where(eq(products.id, productId));
        }
      }
      const codPaid = input.toStatus === "completed" && order.paymentMethod === "cod" && order.paymentStatus === "unpaid";
      await tx.update(orders).set({ status: input.toStatus, updatedAt: now,
        ...(input.toStatus === "confirmed" ? { confirmedAt: now } : {}), ...(input.toStatus === "shipping" ? { shippedAt: now } : {}),
        ...(input.toStatus === "completed" ? { completedAt: now } : {}), ...(input.toStatus === "cancelled" ? { cancelledAt: now, cancelReason: input.reason } : {}),
        ...(input.toStatus === "returned" ? { returnedAt: now } : {}), ...(codPaid ? { paymentStatus: "paid" as const, paidAt: now } : {}),
      }).where(eq(orders.id, order.id));
      await tx.insert(orderEvents).values({ orderId: order.id, type: "status_changed", fromStatus: order.status, toStatus: input.toStatus, message: input.reason || null, actorId });
      if (codPaid) await tx.insert(orderEvents).values({ orderId: order.id, type: "payment_updated", message: "Đã nhận tiền COD khi hoàn thành đơn", actorId });
      return { orderId: order.id };
    });
  }

  async function setPayment(orderId: string, paymentStatus: "paid" | "refunded", actorId: string) {
    return db.transaction(async (tx) => {
      const order = await requireOrder(orderId, tx);
      if (order.paymentStatus === paymentStatus) return { orderId };
      if (paymentStatus === "paid" && (order.paymentStatus !== "unpaid" || restoresStock(order.status))) throw new AppError("INVALID_TRANSITION");
      if (paymentStatus === "refunded" && (order.paymentStatus !== "paid" || !restoresStock(order.status))) throw new AppError("INVALID_TRANSITION");
      await tx.update(orders).set({ paymentStatus, ...(paymentStatus === "paid" ? { paidAt: new Date() } : {}), updatedAt: new Date() }).where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({ orderId, type: "payment_updated", message: paymentStatus === "paid" ? "Đã nhận tiền" : "Đã hoàn tiền", actorId });
      return { orderId };
    });
  }

  async function publicDTO(order: OrderRow, masked: boolean): Promise<OrderPublicDTO> {
    const [items, events] = await Promise.all([
      db.select({ id: orderItems.id, productId: orderItems.productId, productSlug: orderItems.productSlug, productName: orderItems.productName, colorName: orderItems.colorName,
        size: orderItems.size, sku: orderItems.sku, imageUrl: orderItems.imageUrl, unitPrice: orderItems.unitPrice, quantity: orderItems.quantity, lineTotal: orderItems.lineTotal }).from(orderItems).where(eq(orderItems.orderId, order.id)),
      db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(asc(orderEvents.createdAt), asc(orderEvents.id)),
    ]);
    return { code: order.code, createdAt: order.createdAt.toISOString(), status: order.status, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
      customerName: order.customerName, customerPhone: masked ? maskPhone(order.customerPhone) : order.customerPhone, items, total: order.total, carrier: order.carrier,
      trackingCode: order.trackingCode, cancelReason: order.cancelReason,
      events: events.filter((event) => !masked || event.type !== "note").map((event) => ({ id: event.id, type: event.type, fromStatus: event.fromStatus, toStatus: event.toStatus,
        message: event.type === "note" ? event.message : null, createdAt: event.createdAt.toISOString() })),
    };
  }
  async function successDTO(order: OrderRow): Promise<OrderSuccessDTO> {
    const config = await readSettings(db);
    return { ...await publicDTO(order, false), customerEmail: order.customerEmail, province: order.province, ward: order.ward, addressLine: order.addressLine,
      subtotal: order.subtotal, discountAmount: order.discountAmount, shippingFee: order.shippingFee, bank: order.paymentMethod === "bank_transfer" && bankTransferEnabled(config.bank) ? config.bank : null };
  }
  async function lookup(raw: z.output<typeof orderLookupSchema>, ip: string): Promise<OrderPublicDTO> {
    await rateLimit(`lookup:${ip}`, 10, 600, db);
    const input = orderLookupSchema.parse(raw);
    const [order] = input.website ? [] : await db.select().from(orders).where(and(eq(orders.code, input.code), eq(orders.customerPhone, input.phone)));
    if (!order) throw new AppError("NOT_FOUND", "Không tìm thấy đơn hàng với thông tin đã nhập.");
    return publicDTO(order, true);
  }
  async function getSuccess(code: string, token: string) {
    if (token.length > 256) throw new AppError("NOT_FOUND");
    const [order] = await db.select().from(orders).where(eq(orders.code, code));
    if (!order || !timingSafeEqual(Buffer.from(hashToken(token), "hex"), Buffer.from(order.accessTokenHash, "hex"))) throw new AppError("NOT_FOUND");
    return successDTO(order);
  }
  async function getAdminDetail(id: string): Promise<OrderAdminDetailDTO> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) throw new AppError("NOT_FOUND");
    return { ...await successDTO(order), id, adminNote: order.adminNote, note: order.note, paidAt: order.paidAt?.toISOString() ?? null };
  }
  async function updateShipping(orderId: string, carrier: string, trackingCode: string, actorId: string) {
    return db.transaction(async (tx) => {
      await requireOrder(orderId, tx);
      await tx.update(orders).set({ carrier: carrier || null, trackingCode: trackingCode || null, updatedAt: new Date() }).where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({ orderId, type: "shipping_updated", message: [carrier, trackingCode].filter(Boolean).join(" · "), actorId });
      return { orderId };
    });
  }
  async function addNote(orderId: string, message: string, actorId: string) {
    return db.transaction(async (tx) => {
      await requireOrder(orderId, tx);
      await tx.update(orders).set({ adminNote: message, updatedAt: new Date() }).where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({ orderId, type: "note", message, actorId });
      return { orderId };
    });
  }
  return { placeOrder, placeOrderWithOutcome, updateStatus, markPaid: (id: string, actorId: string) => setPayment(id, "paid", actorId),
    markRefunded: (id: string, actorId: string) => setPayment(id, "refunded", actorId), lookup, getSuccess, getAdminDetail, updateShipping, addNote };
}

export function getOrderService() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Thiếu BETTER_AUTH_SECRET");
  return createOrderService(getDatabase(), secret);
}
