export type ShippingPolicy = { fee: number; freeShipMinItems: number | null; freeShipMinAmount: number | null };
export function freeShipProgress(subtotal: number, itemCount: number, shipping: ShippingPolicy) {
  const eligible = (shipping.freeShipMinItems !== null && itemCount >= shipping.freeShipMinItems)
    || (shipping.freeShipMinAmount !== null && subtotal >= shipping.freeShipMinAmount);
  return {
    eligible,
    remainingItems: shipping.freeShipMinItems === null ? null : Math.max(0, shipping.freeShipMinItems - itemCount),
    remainingAmount: shipping.freeShipMinAmount === null ? null : Math.max(0, shipping.freeShipMinAmount - subtotal),
  };
}
