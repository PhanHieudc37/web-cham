import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/constants";
import { idSchema, optionalText } from "./common";

export const orderStatusInputSchema = z.object({ orderId: idSchema, toStatus: z.enum(ORDER_STATUSES), reason: optionalText(500) }).refine((value) => value.toStatus !== "cancelled" || value.reason.length >= 2, { path: ["reason"], error: "Vui lòng nhập lý do hủy đơn" });
export const inventoryInputSchema = z.object({ variantId: idSchema, expectedStock: z.number().int().min(0).max(1_000_000), newStock: z.number().int().min(0).max(1_000_000), note: optionalText(500) });
export const shippingInputSchema = z.object({ orderId: idSchema, carrier: optionalText(60), trackingCode: optionalText(100) });
export const orderNoteSchema = z.object({ orderId: idSchema, message: z.string().trim().min(1, "Vui lòng nhập ghi chú").max(1000) });
