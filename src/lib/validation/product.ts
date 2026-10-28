import { z } from "zod";
import { idSchema, moneySchema, optionalText, requiredText, slugSchema } from "./common";

export const productInputSchema = z.object({
  id: idSchema.optional(), code: requiredText(1, 40).regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ dùng chữ, số, gạch ngang hoặc gạch dưới"),
  name: requiredText(2, 160), slug: slugSchema.optional(), categoryId: idSchema, status: z.enum(["draft", "active", "archived"]),
  price: moneySchema.refine((value) => value > 0, "Giá phải lớn hơn 0"), compareAtPrice: moneySchema.nullable(),
  description: optionalText(20000), material: optionalText(300), fit: optionalText(100), care: z.array(z.string().max(300)).max(20).default([]),
  sizeChartId: idSchema.nullable().default(null), isNew: z.boolean().default(false), isBestSeller: z.boolean().default(false), sortOrder: z.number().int().min(0).default(0),
  seoTitle: optionalText(100), seoDescription: optionalText(300),
  colors: z.array(z.object({ id: idSchema.optional(), name: requiredText(1, 50), code: slugSchema, hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Mã màu không hợp lệ") })).min(1).max(20),
  variants: z.array(z.object({ id: idSchema.optional(), colorCode: slugSchema, size: requiredText(1, 20), sku: requiredText(1, 80), stock: z.number().int().min(0).max(1000000), expectedStock: z.number().int().min(0).max(1000000).optional(), isActive: z.boolean().default(true) })).min(1).max(200),
  images: z.array(z.object({ id: idSchema.optional(), url: z.string().min(1).max(2048), storagePath: z.string().min(1).max(500), alt: optionalText(200), colorCode: slugSchema.nullable().default(null) })).max(12).default([]),
}).refine((value) => value.compareAtPrice === null || value.compareAtPrice > value.price, { path: ["compareAtPrice"], error: "Giá gốc phải lớn hơn giá bán" })
  .refine((value) => new Set(value.colors.map((color) => color.code)).size === value.colors.length, { path: ["colors"], error: "Mã màu không được trùng" })
  .refine((value) => new Set(value.variants.map((variant) => `${variant.colorCode}:${variant.size}`)).size === value.variants.length, { path: ["variants"], error: "Biến thể màu/size không được trùng" })
  .refine((value) => new Set(value.variants.map((variant) => variant.sku.toUpperCase())).size === value.variants.length, { path: ["variants"], error: "SKU không được trùng" })
  .refine((value) => value.images.every((image) => image.colorCode === null || value.colors.some((color) => color.code === image.colorCode)), { path: ["images"], error: "Ảnh phải thuộc màu đã khai báo" })
  .refine((value) => value.variants.every((variant) => value.colors.some((color) => color.code === variant.colorCode)), { path: ["variants"], error: "Biến thể phải thuộc màu đã khai báo" });
export type ProductInput = z.output<typeof productInputSchema>;
