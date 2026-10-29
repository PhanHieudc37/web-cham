import "server-only";

import type { OrderAdminDetailDTO } from "@/types/dto";
import { emailLayout, escapeHtml, type EmailContent } from "./layout";

export function orderShipped(order: OrderAdminDetailDTO, shopName: string): EmailContent {
  const lines = [`Chào ${order.customerName},`, `Đơn hàng ${order.code} của bạn đang được giao.`, order.carrier ? `Hãng vận chuyển: ${order.carrier}` : "", `Mã vận đơn: ${order.trackingCode}`, `Cảm ơn bạn đã mua hàng tại ${shopName}!`].filter(Boolean);
  return { subject: `Đơn hàng ${order.code} đang giao | ${shopName}`, text: lines.join("\n"), html: emailLayout(shopName, `ĐƠN ${order.code} ĐANG GIAO`, lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")) };
}
