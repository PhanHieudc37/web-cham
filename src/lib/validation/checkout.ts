import { z } from "zod";
import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "@/lib/constants";
import { emailSchema, idSchema, moneySchema, optionalText, phoneSchema, requiredText } from "./common";

export const cartLineSchema = z.object({ variantId: idSchema, quantity: z.number().int().min(1, "Số lượng tối thiểu là 1").max(MAX_QUANTITY_PER_LINE, `Mỗi dòng tối đa ${MAX_QUANTITY_PER_LINE} sản phẩm`) });
const uniqueLines = (lines: { variantId: string }[]) => new Set(lines.map((line) => line.variantId)).size === lines.length;
export const cartQuoteSchema = z.object({ lines: z.array(cartLineSchema).max(MAX_CART_LINES).refine(uniqueLines, "Mỗi biến thể chỉ được có một dòng"), discountCode: z.literal("").optional() });
export const checkoutSchema = z.object({
  lines: z.array(cartLineSchema).min(1, "Giỏ hàng đang trống").max(MAX_CART_LINES).refine(uniqueLines, "Mỗi biến thể chỉ được có một dòng"),
  customerName: requiredText(2, 60), customerPhone: phoneSchema, customerEmail: emailSchema,
  province: requiredText(2, 80), ward: requiredText(2, 80), addressLine: requiredText(5, 200), note: optionalText(500),
  paymentMethod: z.enum(["cod", "bank_transfer"], { error: "Vui lòng chọn phương thức thanh toán" }),
  acceptedPolicies: z.literal(true, { error: "Vui lòng đồng ý với chính sách" }),
  expectedTotal: moneySchema, idempotencyKey: idSchema, website: optionalText(200),
});
export const orderLookupSchema = z.object({ code: requiredText(4, 24).transform((value) => value.toUpperCase()), phone: phoneSchema, website: optionalText(200) });
export type CheckoutInput = z.output<typeof checkoutSchema>;
export type CartLineInput = z.output<typeof cartLineSchema>;
