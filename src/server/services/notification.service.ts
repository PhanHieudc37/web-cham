import "server-only";

import { formatPrice } from "@/lib/format";
import type { OrderAdminDetailDTO } from "@/types/dto";
import { getServerEnv } from "@/server/env";
import type { EmailContent } from "@/server/emails/layout";
import { orderConfirmation } from "@/server/emails/order-confirmation";
import { newOrder } from "@/server/emails/new-order";
import { orderShipped } from "@/server/emails/order-shipped";
import { newContact } from "@/server/emails/new-contact";
import type { ContactMessageDTO } from "@/types/contact";

type Mail = EmailContent & { to: string; key: string };
async function sendMail(orderCode: string, content: Mail) {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) {
    console.info("[email:dev]", { orderCode, template: content.key.split("/")[0], subject: content.subject, personalData: "[đã ẩn]" });
    return;
  }
  if (!env.EMAIL_FROM || !content.to) throw new Error("Email chưa được cấu hình đầy đủ");
  // Avoid SDK dev logging of provider error bodies containing personal data.
  const response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": content.key }, body: JSON.stringify({ from: env.EMAIL_FROM, to: content.to, subject: content.subject, html: content.html, text: content.text }) });
  if (!response.ok) throw new Error("Không gửi được email");
}
export async function notifyOrderShipped(order: OrderAdminDetailDTO, shopName: string) {
  if (!order.customerEmail || !order.trackingCode) return;
  try { await sendMail(order.code, { ...orderShipped(order, shopName), to: order.customerEmail, key: `order-shipped/${order.id}` }); }
  catch { console.error("[notification] Shipping email failed", { orderCode: order.code }); }
}
export async function notifyNewContact(message: ContactMessageDTO, shopName: string) {
  const env = getServerEnv();
  if (!env.SHOP_NOTIFY_EMAIL && env.RESEND_API_KEY) return;
  const adminUrl = new URL("/admin/messages", env.NEXT_PUBLIC_SITE_URL).toString();
  try { await sendMail(message.id, { ...newContact(message, shopName, adminUrl), to: env.SHOP_NOTIFY_EMAIL ?? "", key: `new-contact/${message.id}` }); }
  catch { console.error("[notification] Contact email failed", { messageId: message.id }); }
}
export async function notifyOrderCreated(order: OrderAdminDetailDTO, shopName: string, accessToken: string) {
  const env = getServerEnv();
  const successUrl = new URL("/checkout/success", env.NEXT_PUBLIC_SITE_URL);
  successUrl.search = new URLSearchParams({ code: order.code, t: accessToken }).toString();
  const adminUrl = new URL(`/admin/orders/${order.id}`, env.NEXT_PUBLIC_SITE_URL).toString();
  const mail = (content: Mail) => sendMail(order.code, content);
  const tasks: Promise<unknown>[] = [];
  if (order.customerEmail) tasks.push(mail({ ...orderConfirmation(order, shopName, successUrl.toString()), to: order.customerEmail, key: `order-confirmation/${order.id}` }));
  if (env.SHOP_NOTIFY_EMAIL || !env.RESEND_API_KEY) tasks.push(mail({ ...newOrder(order, shopName, adminUrl), to: env.SHOP_NOTIFY_EMAIL ?? "", key: `new-order/${order.id}` }));
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) tasks.push((async () => {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000), body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `Đơn mới ${order.code}\n${formatPrice(order.total)} — ${order.paymentMethod === "cod" ? "COD" : "Chuyển khoản"}\n${adminUrl}` }) });
    if (!response.ok) throw new Error("Không gửi được thông báo Telegram");
  })());
  const results = await Promise.allSettled(tasks);
  for (const result of results) if (result.status === "rejected") console.error("[notification] Delivery failed", { orderCode: order.code });
}
