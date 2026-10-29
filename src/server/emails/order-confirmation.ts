import "server-only";

import { formatPrice } from "@/lib/format";
import type { OrderSuccessDTO } from "@/types/dto";
import { emailLayout, escapeHtml, type EmailContent } from "./layout";

export function orderConfirmation(order: OrderSuccessDTO, shopName: string, successUrl: string): EmailContent {
  const lines = order.items.map((item) => `${item.productName} (${item.colorName} / ${item.size}) × ${item.quantity}: ${formatPrice(item.lineTotal)}`);
  const payment = order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản ngân hàng";
  const address = [order.addressLine, order.ward, order.province].join(", ");
  const bank = order.bank && order.paymentStatus === "unpaid" ? `Ngân hàng: ${order.bank.bankName}\nSố tài khoản: ${order.bank.accountNo}\nChủ tài khoản: ${order.bank.accountName}\nNội dung chuyển khoản: ${order.code}` : "";
  const subject = `Xác nhận đơn hàng ${order.code} | ${shopName}`;
  return { subject,
    text: [`Cảm ơn ${order.customerName} đã đặt hàng tại ${shopName}!`, `Mã đơn: ${order.code}`, ...lines, `Tạm tính: ${formatPrice(order.subtotal)}`, `Phí vận chuyển: ${formatPrice(order.shippingFee)}`, `Tổng cộng: ${formatPrice(order.total)}`, payment, `Người nhận: ${order.customerName} — ${order.customerPhone}`, `Địa chỉ: ${address}`, bank, `Xem đơn hàng và mã QR: ${successUrl}`, "Shop sẽ liên hệ xác nhận đơn trong vòng 24 giờ."].filter(Boolean).join("\n"),
    html: emailLayout(shopName, `ĐÃ NHẬN ĐƠN ${order.code}`, `<p>Cảm ơn ${escapeHtml(order.customerName)} đã đặt hàng!</p><ul style="padding-left:20px">${lines.map((line) => `<li style="padding:6px 0">${escapeHtml(line)}</li>`).join("")}</ul><p>Tạm tính: ${formatPrice(order.subtotal)}<br>Phí vận chuyển: ${formatPrice(order.shippingFee)}<br><strong>Tổng cộng: ${formatPrice(order.total)}</strong></p><p>${payment}</p><p><strong>Thông tin giao hàng</strong><br>${escapeHtml(order.customerName)} — ${escapeHtml(order.customerPhone)}<br>${escapeHtml(address)}</p>${bank ? `<p>${escapeHtml(bank).replace(/\n/g, "<br>")}</p>` : ""}<p><a href="${escapeHtml(successUrl)}" style="color:#111">Xem đơn hàng và mã QR</a></p><p>Shop sẽ liên hệ xác nhận đơn trong vòng 24 giờ.</p>`),
  };
}
