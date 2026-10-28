import { z } from "zod";
import { idSchema, requiredText } from "./common";

export const bannerInputSchema = z.object({
  id: idSchema.optional(), title: requiredText(1, 100), desktopImageUrl: requiredText(1, 2048), desktopImagePath: requiredText(1, 500),
  mobileImageUrl: requiredText(1, 2048), mobileImagePath: requiredText(1, 500), alt: requiredText(1, 200),
  href: z.string().trim().max(2048).refine((value) => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value), "Liên kết không hợp lệ"),
  ctaLabel: requiredText(1, 60), sortOrder: z.number().int().min(0), isActive: z.boolean(), startsAt: z.iso.datetime().nullable(), endsAt: z.iso.datetime().nullable(),
}).refine((value) => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt, { path: ["endsAt"], error: "Ngày kết thúc phải sau ngày bắt đầu" });
