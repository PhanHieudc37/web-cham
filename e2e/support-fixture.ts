import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { contactMessages, orderEvents, orderItems, orders, user } from "../src/server/db/schema";
config({ path: [".env.test.local", ".env"], quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Chỉ dùng fixture trên _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) if (new URL(value).host === new URL(url).host && new URL(value).pathname === new URL(url).pathname) throw new Error("Không sửa dev/prod");
const database = createDatabase(url);
try {
  const [actor] = await database.db.select({ id: user.id }).from(user).where(eq(user.email, "staff@example.test"));
  if (!actor) throw new Error("Thiếu tài khoản fixture");
  if (process.argv[2] === "reset") {
    await database.db.execute(sql`TRUNCATE orders, contact_messages, rate_limits CASCADE`);
    for (const [index, status] of (["shipping", "cancelled", "returned"] as const).entries()) {
      const id = crypto.randomUUID(), code = index === 0 ? "CSLOOK11" : index === 1 ? "CSCANCEL11" : "CSRETURN11";
      await database.db.insert(orders).values({ id, code, accessTokenHash: "0".repeat(64), idempotencyKey: id, status, paymentMethod: "bank_transfer", paymentStatus: status === "returned" ? "refunded" : "paid", customerName: "Người nhận kiểm thử", customerPhone: "0912345678", customerEmail: "private@example.test", addressLine: "PRIVATE_ADDRESS", ward: "PRIVATE_WARD", province: "PRIVATE_PROVINCE", note: "PRIVATE_CUSTOMER_NOTE", adminNote: "PRIVATE_INTERNAL_NOTE", subtotal: 200000, shippingFee: 30000, total: 230000, carrier: "GHN", trackingCode: "TRACK11", cancelReason: status === "cancelled" ? "Khách yêu cầu hủy" : null, createdAt: new Date("2026-10-27T01:00:00Z") });
      await database.db.insert(orderItems).values({ orderId: id, productName: "Áo tra cứu kiểm thử", productSlug: "ao-thu", colorName: "Đen", size: "M", sku: "LOOK11-M", unitPrice: 100000, quantity: 2, lineTotal: 200000, imageUrl: "/images/placeholder.svg" });
      await database.db.insert(orderEvents).values([{ orderId: id, type: "created", toStatus: "pending", createdAt: new Date("2026-10-27T01:00:00Z") }, { orderId: id, type: "status_changed", fromStatus: "pending", toStatus: "confirmed", actorId: actor.id, createdAt: new Date("2026-10-27T02:00:00Z") }, { orderId: id, type: "status_changed", fromStatus: "confirmed", toStatus: status, actorId: actor.id, message: status === "returned" ? "Khách gửi lại hàng" : status === "cancelled" ? "Khách yêu cầu hủy" : null, createdAt: new Date("2026-10-27T03:00:00Z") }, { orderId: id, type: "note", message: "PRIVATE_INTERNAL_NOTE", actorId: actor.id }]);
    }
  } else if (process.argv[2] === "populate") {
    await database.db.insert(contactMessages).values(Array.from({ length: 23 }, (_, index) => ({ name: `Khách phân trang ${index}`, phone: "0987654321", message: "Nội dung kiểm thử phân trang tin nhắn", status: index < 2 ? "handled" as const : "new" as const, handledBy: index < 2 ? actor.id : null, handledAt: index < 2 ? new Date() : null })));
  } else if (process.argv[2] !== "read") throw new Error("Lệnh fixture không hợp lệ");
  const [state] = await database.db.execute<{ messages: number; handled: number; orders: number }>(sql`select (select count(*)::integer from contact_messages) as messages, (select count(*)::integer from contact_messages where status='handled') as handled, (select count(*)::integer from orders) as orders`);
  console.log(JSON.stringify(state));
} finally { await database.connection.end(); }
