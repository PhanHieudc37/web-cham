import { z } from "zod";
import { idSchema, requiredText } from "./common";

export const bannerInputSchema = z.object({
  id: idSchema.optional(), title: requiredText(1, 100), desktopImageUrl: requiredText(1, 2048), desktopImagePath: requiredText(1, 500),
  mobileImageUrl: requiredText(1, 2048), mobileImagePath: requiredText(1, 500), alt: requiredText(1, 200),
  href: z.string().trim().max(2048).refine((value) => { if (/[\\\x00-\x20]/.test(value)) return false; if (/^\/(?!\/)/.test(value)) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }, "Liên kết không hợp lệ"),
  ctaLabel: requiredText(1, 60), sortOrder: z.number().int().min(0), isActive: z.boolean(), startsAt: z.iso.datetime().nullable(), endsAt: z.iso.datetime().nullable(),
}).refine((value) => !value.startsAt || !value.endsAt || new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), { path: ["endsAt"], error: "Ngày kết thúc phải sau ngày bắt đầu" });
