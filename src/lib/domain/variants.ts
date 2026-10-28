import { MAX_QUANTITY_PER_LINE } from "@/lib/constants";

export const createSku = (code: string, colorCode: string, size: string) => `${code}-${colorCode}-${size}`.toUpperCase();
export function variantAvailability(stock: number, active: boolean, lowStockThreshold = 3, maxQty = MAX_QUANTITY_PER_LINE) {
  return { available: active && stock > 0, maxQuantity: active ? Math.max(0, Math.min(stock, maxQty)) : 0, lowStockCount: active && stock > 0 && stock <= lowStockThreshold ? stock : null };
}
