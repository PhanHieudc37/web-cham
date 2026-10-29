import "server-only";

import type { ContactMessageDTO } from "@/types/contact";
import { emailLayout, escapeHtml, type EmailContent } from "./layout";

export function newContact(message: ContactMessageDTO, shopName: string, adminUrl: string): EmailContent {
  const details = [`Họ tên: ${message.name}`, `SĐT: ${message.phone}`, message.email ? `Email: ${message.email}` : "", `Nội dung:\n${message.message}`].filter(Boolean);
  return { subject: `Tin nhắn liên hệ mới | ${shopName}`, text: [...details, `Xem và xử lý: ${adminUrl}`].join("\n"), html: emailLayout(shopName, "TIN NHẮN LIÊN HỆ MỚI", details.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`).join("") + `<p><a href="${escapeHtml(adminUrl)}" style="color:#111">Xem và xử lý trong admin</a></p>`) };
}
