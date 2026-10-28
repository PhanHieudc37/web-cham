import { z } from "zod";
export const MEDIA_MAX_BYTES = 2 * 1024 * 1024;
export const uploadInputSchema = z.object({
  folder: z.enum(["products", "banners", "categories", "settings"]),
  file: z.instanceof(File).refine((file) => file.size > 0 && file.size <= MEDIA_MAX_BYTES, "Ảnh phải có dung lượng từ 1 byte đến 2 MB")
    .refine((file) => ["image/webp", "image/jpeg", "image/png"].includes(file.type), "Chỉ chấp nhận ảnh WebP, JPEG hoặc PNG"),
});
export type MediaReference = { url: string; path: string };
