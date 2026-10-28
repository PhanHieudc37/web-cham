import { describe, expect, it } from "vitest";
import { MAX_VND, ORDER_STATUSES } from "@/lib/constants";
import { calculatePricing, discountPercent } from "./pricing";
import { freeShipProgress } from "./shipping";
import { canTransition, getNextStatuses, restoresStock } from "./order-status";
import { sortSizes } from "./sizes";
import { createSku, variantAvailability } from "./variants";

const shipping = { fee: 30000, freeShipMinItems: 3, freeShipMinAmount: null };
describe("pricing and shipping", () => {
  it("calculates integer VND totals from unit prices and quantities", () => {
    expect(calculatePricing([{ unitPrice: 199000, quantity: 2 }], shipping)).toMatchObject({ itemCount: 2, subtotal: 398000, discountAmount: 0, shippingFee: 30000, total: 428000 });
  });
  it("grants free shipping at either configured threshold", () => {
    expect(calculatePricing([{ unitPrice: 100000, quantity: 3 }], shipping).shippingFee).toBe(0);
    expect(calculatePricing([{ unitPrice: 500000, quantity: 1 }], { ...shipping, freeShipMinAmount: 500000 }).shippingFee).toBe(0);
    expect(freeShipProgress(100000, 1, { ...shipping, freeShipMinAmount: 500000 })).toEqual({ eligible: false, remainingItems: 2, remainingAmount: 400000 });
  });
  it("does not grant free shipping when both thresholds are disabled", () => {
    expect(calculatePricing([{ unitPrice: 100000, quantity: 5 }], { ...shipping, freeShipMinItems: null }).shippingFee).toBe(30000);
    expect(freeShipProgress(0, 0, { ...shipping, freeShipMinItems: null })).toEqual({ eligible: false, remainingItems: null, remainingAmount: null });
  });
  it("keeps an empty or entirely unavailable cart at zero", () => {
    expect(calculatePricing([], shipping).total).toBe(0);
    expect(calculatePricing([{ unitPrice: 100000, quantity: 0 }], shipping).total).toBe(0);
  });
  it.each([{ unitPrice: -1, quantity: 1 }, { unitPrice: 1.5, quantity: 1 }, { unitPrice: 100, quantity: -1 }, { unitPrice: 100, quantity: 0.5 }, { unitPrice: MAX_VND, quantity: 2 }])("rejects invalid money/quantity or database overflow: %j", (line) => {
    expect(() => calculatePricing([line], shipping)).toThrow(RangeError);
  });
  it("rounds a sale percentage and omits non-sales", () => {
    expect(discountPercent(199000, 300000)).toBe(34);
    expect(discountPercent(100000, null)).toBeNull();
    expect(discountPercent(100000, 100000)).toBeNull();
    expect(discountPercent(100000, 50000)).toBeNull();
  });
});
describe("order status state machine", () => {
  const allowed = ["pending:confirmed", "pending:cancelled", "confirmed:shipping", "confirmed:cancelled", "shipping:completed", "shipping:returned", "completed:returned"];
  it("allows exactly the documented transitions", () => {
    for (const from of ORDER_STATUSES) for (const to of ORDER_STATUSES) expect(canTransition(from, to), `${from} → ${to}`).toBe(allowed.includes(`${from}:${to}`));
    expect(getNextStatuses("pending")).toEqual(["confirmed", "cancelled"]);
    expect(getNextStatuses("cancelled")).toEqual([]);
    expect(getNextStatuses("returned")).toEqual([]);
  });
  it("restores stock only for cancellations and returns", () => {
    expect(ORDER_STATUSES.filter(restoresStock)).toEqual(["cancelled", "returned"]);
  });
});
describe("sizes and variants", () => {
  it("sorts standard sizes first, deduplicates and keeps the input intact", () => {
    const input = ["XL", "B", "M", "XS", "A", "M", "Freesize", "3XL", "XXL", "L", "S"];
    const original = [...input];
    expect(sortSizes(input)).toEqual(["XS", "S", "M", "L", "XL", "XXL", "3XL", "Freesize", "A", "B"]);
    expect(input).toEqual(original);
  });
  it("builds stable uppercase SKUs", () => expect(createSku("cs01", "den", "m")).toBe("CS01-DEN-M"));
  it("caps purchase quantity and only reveals low stock counts", () => {
    expect(variantAvailability(100, true)).toEqual({ available: true, maxQuantity: 10, lowStockCount: null });
    expect(variantAvailability(2, true)).toEqual({ available: true, maxQuantity: 2, lowStockCount: 2 });
    expect(variantAvailability(0, true)).toEqual({ available: false, maxQuantity: 0, lowStockCount: null });
    expect(variantAvailability(2, false)).toEqual({ available: false, maxQuantity: 0, lowStockCount: null });
    expect(variantAvailability(8, true, 10, 5)).toEqual({ available: true, maxQuantity: 5, lowStockCount: 8 });
  });
});
