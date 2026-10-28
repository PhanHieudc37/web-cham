import { z } from "zod";
import { MAX_QUANTITY_PER_LINE } from "@/lib/constants";
import { moneySchema } from "./common";

const text = z.string().trim().max(1000);
const link = z.string().trim().max(2048).refine((value) => value === "" || /^https?:\/\//.test(value), "Liên kết phải bắt đầu bằng http hoặc https");
const image = z.string().max(2048).refine((value) => /^https?:\/\//.test(value) || value.startsWith("/images/"), "Địa chỉ ảnh không hợp lệ").nullable();
export const settingsSchemas = {
  shop: z.object({ name: z.string().trim().min(1).max(80), description: text, logoUrl: image, phone: text, zaloPhone: text, email: text, address: text, workingHours: text }),
  social: z.object({ facebook: link, messenger: link, instagram: link, tiktok: link, shopee: link }),
  announcements: z.array(z.string().trim().min(1).max(300)).max(10),
  policies: z.array(z.object({ icon: z.enum(["truck", "refresh", "wallet", "message"]), text: z.string().trim().min(1).max(200) })).max(8),
  returnPolicySummary: z.string().max(4000),
  shipping: z.object({ fee: moneySchema, freeShipMinItems: z.number().int().min(1).max(200).nullable(), freeShipMinAmount: moneySchema.nullable() }),
  bank: z.object({ bankBin: z.string().regex(/^\d{6}$|^$/, "Mã BIN gồm 6 chữ số"), bankName: text, accountNo: z.string().regex(/^[a-zA-Z0-9]{1,40}$|^$/, "Số tài khoản không hợp lệ"), accountName: text }),
  legal: z.object({ businessName: text, taxCode: text, businessAddress: text, bctNotificationUrl: link, bctBadgeUrl: link }),
  orders: z.object({ codePrefix: z.string().trim().regex(/^[A-Z]{1,6}$/, "Tiền tố chỉ gồm 1–6 chữ in hoa"), autoCancelUnpaidHours: z.number().int().min(1).max(720), lowStockThreshold: z.number().int().min(0).max(100000), maxQtyPerLine: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE) }),
  seo: z.object({ defaultTitle: z.string().trim().min(1).max(100), defaultDescription: z.string().max(300), ogImageUrl: image }),
};
export type Settings = { [K in keyof typeof settingsSchemas]: z.output<(typeof settingsSchemas)[K]> };
export type SettingKey = keyof Settings;
export const defaultSettings: Settings = {
  shop: { name: "Cham.stu", description: "", logoUrl: null, phone: "", zaloPhone: "", email: "", address: "", workingHours: "" },
  social: { facebook: "", messenger: "", instagram: "", tiktok: "", shopee: "https://shopee.vn/cham.stu" },
  announcements: ["Miễn phí vận chuyển cho đơn từ 3 sản phẩm"],
  policies: [{ icon: "truck", text: "Freeship đơn từ 3 sản phẩm" }, { icon: "refresh", text: "Đổi size trong 7 ngày" }, { icon: "wallet", text: "Thanh toán khi nhận hàng" }, { icon: "message", text: "Hỗ trợ qua Zalo / Messenger" }],
  returnPolicySummary: "", shipping: { fee: 30000, freeShipMinItems: 3, freeShipMinAmount: null },
  bank: { bankBin: "", bankName: "", accountNo: "", accountName: "" },
  legal: { businessName: "", taxCode: "", businessAddress: "", bctNotificationUrl: "", bctBadgeUrl: "" },
  orders: { codePrefix: "CS", autoCancelUnpaidHours: 48, lowStockThreshold: 3, maxQtyPerLine: 10 },
  seo: { defaultTitle: "Cham.stu", defaultDescription: "", ogImageUrl: null },
};
export const bankTransferEnabled = (bank: Settings["bank"]) => Boolean(bank.bankBin && bank.accountNo && bank.accountName);
export const settingKeySchema = z.enum(["shop", "social", "announcements", "policies", "returnPolicySummary", "shipping", "bank", "legal", "orders", "seo"]);
