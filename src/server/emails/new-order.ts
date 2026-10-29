import "server-only";

import { formatPrice } from "@/lib/format";
import type { OrderAdminDetailDTO } from "@/types/dto";
import { emailLayout, escapeHtml, type EmailContent } from "./layout";

export function newOrder(order: OrderAdminDetailDTO, shopName: string, adminUrl: string): EmailContent {
  const lines = order.items.map((item) => `${item.sku} — ${item.productName} (${item.colorName} / ${item.size}) × ${item.quantity}: ${formatPrice(item.lineTotal)}`);
  const payment = order.paymentMethod === "cod" ? "COD" : "Chuyển khoản ngân hàng";
  const address = [order.addressLine, order.ward, order.province].join(", ");
  const text = [`Có đơn hàng mới ${order.code}`, ...lines, `Tổng tiền: ${formatPrice(order.total)} — ${payment}`, `Khách: ${order.customerName} — ${order.customerPhone}`, `Địa chỉ: ${address}`, order.note ? `Ghi chú: ${order.note}` : "", `Xử lý đơn: ${adminUrl}`].filter(Boolean).join("\n");
  return { subject: `Đơn hàng mới ${order.code} | ${shopName}`, text,
    html: emailLayout(shopName, `ĐƠN HÀNG MỚI ${order.code}`, `<ul style="padding-left:20px">${lines.map((line) => `<li style="padding:6px 0">${escapeHtml(line)}</li>`).join("")}</ul><p><strong>Tổng tiền: ${formatPrice(order.total)}</strong><br>${payment}</p><p>${escapeHtml(order.customerName)} — ${escapeHtml(order.customerPhone)}<br>${escapeHtml(address)}</p>${order.note ? `<p>Ghi chú: ${escapeHtml(order.note)}</p>` : ""}<p><a href="${escapeHtml(adminUrl)}" style="color:#111">Xử lý đơn hàng</a></p>`),
  };
}
