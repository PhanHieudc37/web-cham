import { z } from "zod";
import { idSchema, optionalText, requiredText, slugSchema } from "./common";

export const collectionInputSchema = z.object({ id: idSchema.optional(), title: requiredText(1, 100), slug: slugSchema.optional(), description: optionalText(2000), bannerUrl: optionalText(2048), bannerPath: optionalText(500), isActive: z.boolean(), showOnHome: z.boolean(), showInMenu: z.boolean(), sortOrder: z.number().int().min(0), productIds: z.array(idSchema).max(500).refine((items) => new Set(items).size === items.length, "Sản phẩm không được trùng") });
