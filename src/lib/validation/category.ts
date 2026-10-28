import { z } from "zod";
import { idSchema, optionalText, requiredText, slugSchema } from "./common";

export const categoryInputSchema = z.object({ id: idSchema.optional(), name: requiredText(1, 100), slug: slugSchema.or(z.literal("")).transform((value) => value || undefined).optional(), parentId: idSchema.nullable(), imageUrl: optionalText(2048), imagePath: optionalText(500), sortOrder: z.number().int().min(0), isActive: z.boolean() });
