import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, lt, lte, or, sql } from "drizzle-orm";
import { ADMIN_PAGE_SIZE, ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { csvRow, dayStart, shiftDay, vietnamDay, type OrderFilters } from "@/lib/order-admin";
import { formatDateTime } from "@/lib/format";
import type { DashboardDTO, OrderListDTO } from "@/types/order-admin";
import { getDatabase, type Database } from "@/server/db/client";
import { orderItems, orders, productColors, products, productVariants } from "@/server/db/schema";
import { readSettings } from "./settings.service";

const itemCount = sql<number>`coalesce((select sum(oi.quantity) from order_items oi where oi.order_id = "orders"."id"), 0)::integer`;
const selection = { id: orders.id, code: orders.code, createdAt: orders.createdAt, customerName: orders.customerName, customerPhone: orders.customerPhone, total: orders.total, status: orders.status, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus, itemCount };
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");
function filterWhere(filters: OrderFilters, includeStatus = true) {
  const query = `%${escapeLike(filters.q)}%`;
  return and(
    filters.q ? or(ilike(orders.code, query), ilike(orders.customerPhone, query), ilike(orders.customerName, query)) : undefined,
    includeStatus && filters.status ? eq(orders.status, filters.status) : undefined,
    filters.from ? gte(orders.createdAt, dayStart(filters.from)) : undefined,
    filters.to ? lt(orders.createdAt, dayStart(shiftDay(filters.to, 1))) : undefined,
    filters.paymentMethod ? eq(orders.paymentMethod, filters.paymentMethod) : undefined,
    filters.paymentStatus ? eq(orders.paymentStatus, filters.paymentStatus) : undefined,
  );
}
export function createOrderAdminService(db: Database) {
  async function list(filters: OrderFilters): Promise<OrderListDTO> {
    const grouped = await db.select({ status: orders.status, count: count() }).from(orders).where(filterWhere(filters, false)).groupBy(orders.status);
    const counts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, grouped.find((row) => row.status === status)?.count ?? 0])) as OrderListDTO["counts"];
    counts.all = grouped.reduce((sum, row) => sum + row.count, 0);
    const total = filters.status ? counts[filters.status] : counts.all;
    const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), page = Math.min(filters.page, totalPages);
    const rows = await db.select(selection).from(orders).where(filterWhere(filters)).orderBy(desc(orders.createdAt), desc(orders.id)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
    return { items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })), total, page, totalPages, counts };
  }
  async function dashboard(role: "admin" | "staff", now = new Date()): Promise<DashboardDTO> {
    const today = vietnamDay(now), tomorrow = dayStart(shiftDay(today, 1));
    const config = await readSettings(db);
    const lowWhere = and(eq(products.status, "active"), eq(productVariants.isActive, true), lte(productVariants.stock, config.orders.lowStockThreshold));
    const [metrics, latest, lowStock, lowCount] = await Promise.all([
      db.select({ todayOrders: sql<number>`count(*) filter (where ${orders.createdAt} >= ${dayStart(today).toISOString()}::timestamptz and ${orders.createdAt} < ${tomorrow.toISOString()}::timestamptz)::integer`, pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::integer`, unpaidTransfer: sql<number>`count(*) filter (where ${orders.paymentMethod} = 'bank_transfer' and ${orders.paymentStatus} = 'unpaid')::integer` }).from(orders),
      db.select(selection).from(orders).orderBy(desc(orders.createdAt), desc(orders.id)).limit(10),
      db.select({ id: productVariants.id, productId: products.id, name: products.name, color: productColors.name, size: productVariants.size, stock: productVariants.stock,
        image: sql<string | null>`(select url from product_images where product_id = ${products.id} order by case when color_id = ${productVariants.colorId} then 0 else 1 end, sort_order, id limit 1)` }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).innerJoin(productColors, eq(productColors.id, productVariants.colorId)).where(lowWhere).orderBy(asc(productVariants.stock), asc(productVariants.id)).limit(50),
      db.select({ count: count() }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(lowWhere),
    ]);
    let revenue: DashboardDTO["revenue"] = null;
    if (role === "admin") {
      const rows = await db.select({ date: sql<string>`to_char(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD')`, total: sql<number>`coalesce(sum(${orders.total}),0)::bigint`.mapWith(Number) }).from(orders)
        .where(and(inArray(orders.status, ["confirmed", "shipping", "completed"]), gte(orders.createdAt, dayStart(shiftDay(today, -29))), lt(orders.createdAt, tomorrow))).groupBy(sql`to_char(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD')`);
      const sumSince = (date: string) => rows.filter((row) => row.date >= date).reduce((sum, row) => sum + row.total, 0);
      revenue = { today: sumSince(today), week: sumSince(shiftDay(today, -6)), month: sumSince(shiftDay(today, -29)), days: Array.from({ length: 14 }, (_, index) => { const date = shiftDay(today, index - 13); return { date, total: rows.find((row) => row.date === date)?.total ?? 0 }; }) };
    }
    return { ...metrics[0], revenue, latest: latest.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })), lowStock, lowStockTotal: lowCount[0].count, threshold: config.orders.lowStockThreshold };
  }
  async function* exportCsv(filters: OrderFilters) {
    yield "\uFEFF" + csvRow(["Mã đơn", "Ngày đặt", "Khách hàng", "SĐT", "Email", "Địa chỉ", "Trạng thái", "Phương thức", "Thanh toán", "Sản phẩm", "Màu", "Size", "SKU", "Đơn giá", "Số lượng", "Thành tiền", "Tạm tính đơn", "Giảm giá đơn", "Phí ship đơn", "Tổng đơn", "Hãng vận chuyển", "Mã vận đơn"]);
    // Keyset batches bound memory; order and item IDs keep pagination deterministic.
    let cursor: { orderId: string; itemId: string } | undefined;
    while (true) {
      const rows = await db.select({ order: orders, item: orderItems }).from(orders).innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(and(filterWhere(filters), cursor ? sql`(${orders.id}, ${orderItems.id}) > (${cursor.orderId}::uuid, ${cursor.itemId}::uuid)` : undefined)).orderBy(asc(orders.id), asc(orderItems.id)).limit(500);
      if (!rows.length) return;
      for (const { order: o, item: i } of rows) yield csvRow([o.code, formatDateTime(o.createdAt), o.customerName, o.customerPhone, o.customerEmail, [o.addressLine, o.ward, o.province].join(", "), ORDER_STATUS_LABELS[o.status], PAYMENT_METHOD_LABELS[o.paymentMethod], PAYMENT_STATUS_LABELS[o.paymentStatus], i.productName, i.colorName, i.size, i.sku, i.unitPrice, i.quantity, i.lineTotal, o.subtotal, o.discountAmount, o.shippingFee, o.total, o.carrier, o.trackingCode]);
      const last = rows[rows.length - 1]; cursor = { orderId: last.order.id, itemId: last.item.id };
      if (rows.length < 500) return;
    }
  }
  return { list, dashboard, exportCsv };
}
export function getOrderAdminService() { return createOrderAdminService(getDatabase()); }
