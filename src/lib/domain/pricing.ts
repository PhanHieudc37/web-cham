import { MAX_VND } from "@/lib/constants";
import { freeShipProgress, type ShippingPolicy } from "./shipping";

export function calculatePricing(lines: readonly { unitPrice: number; quantity: number }[], shipping: ShippingPolicy) {
  let subtotal = 0, itemCount = 0;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.unitPrice) || line.unitPrice < 0 || !Number.isSafeInteger(line.quantity) || line.quantity < 0) throw new RangeError("Giá và số lượng phải là số nguyên không âm");
    subtotal += line.unitPrice * line.quantity;
    itemCount += line.quantity;
  }
  const freeShip = freeShipProgress(subtotal, itemCount, shipping);
  const shippingFee = itemCount === 0 || freeShip.eligible ? 0 : shipping.fee;
  if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(shippingFee) || shippingFee < 0 || subtotal + shippingFee > MAX_VND) throw new RangeError("Tổng tiền vượt giới hạn cho phép");
  return { itemCount, subtotal, discountAmount: 0, shippingFee, total: subtotal + shippingFee, freeShip };
}
export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  return compareAtPrice !== null && compareAtPrice > price ? Math.round((1 - price / compareAtPrice) * 100) : null;
}
