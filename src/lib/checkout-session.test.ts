import { beforeEach, expect, it, vi } from "vitest";
import { clearCheckoutKey, getCheckoutKey } from "./checkout-session";
import { PROVINCES, SORTED_PROVINCES } from "./provinces";
import { checkoutSchema } from "./validation/checkout";

const entries = new Map<string, string>();
beforeEach(() => { entries.clear(); vi.stubGlobal("sessionStorage", { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) }); clearCheckoutKey(); });
it("keeps a checkout key across retries and replaces it only after successful placement", () => {
  const first = getCheckoutKey(); expect(getCheckoutKey()).toBe(first); expect(first).toMatch(/^[0-9a-f-]{36}$/);
  clearCheckoutKey(); expect(getCheckoutKey()).not.toBe(first);
});
it("replaces malformed keys and keeps an in-memory key when storage is blocked", () => {
  entries.set("cham-checkout-key-v1", "invalid"); expect(getCheckoutKey()).not.toBe("invalid"); clearCheckoutKey();
  vi.stubGlobal("sessionStorage", { getItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } });
  const first = getCheckoutKey(); expect(getCheckoutKey()).toBe(first); clearCheckoutKey(); expect(getCheckoutKey()).not.toBe(first);
});
it("has 34 unique provinces with the two cities first and validates the shared checkout schema", () => {
  expect(new Set(PROVINCES).size).toBe(34); expect(SORTED_PROVINCES.slice(0, 2)).toEqual(["Hà Nội", "TP. Hồ Chí Minh"]);
  const input = { lines: [{ variantId: crypto.randomUUID(), quantity: 1 }], idempotencyKey: crypto.randomUUID(), expectedTotal: 100000, customerName: "Khách thử", customerPhone: "+84 912.345.678", province: "Hà Nội", ward: "Phường thử", addressLine: "Địa chỉ kiểm thử", paymentMethod: "cod", acceptedPolicies: true };
  expect(checkoutSchema.parse(input).customerPhone).toBe("0912345678");
  expect(checkoutSchema.safeParse({ ...input, province: "Tỉnh không tồn tại" }).success).toBe(false);
  expect(checkoutSchema.safeParse({ ...input, acceptedPolicies: false }).success).toBe(false);
});
