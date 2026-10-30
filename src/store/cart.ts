"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import * as z from "zod/mini";
import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "@/lib/constants";
import type { CartLineInput } from "@/lib/validation/checkout";

const cartLineSchema = z.object({ variantId: z.uuid(), quantity: z.int().check(z.minimum(1), z.maximum(MAX_QUANTITY_PER_LINE)) });
const savedCartSchema = z.object({ lines: z.array(cartLineSchema).check(z.maxLength(MAX_CART_LINES), z.refine((lines) => new Set(lines.map((line) => line.variantId)).size === lines.length)), note: z.catch(z.string().check(z.maxLength(500)), ""), discountCode: z.catch(z.literal(""), "") });
type SavedCart = z.output<typeof savedCartSchema>;
type CartState = SavedCart & {
  hasHydrated: boolean;
  add: (variantId: string, quantity: number, maxQuantity: number) => string | null;
  setQuantity: (variantId: string, quantity: number, maxQuantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  setNote: (note: string) => void;
  setDiscountCode: (code: string) => void;
};
const emptyCart: SavedCart = { lines: [], note: "", discountCode: "" };
const limit = (maxQuantity: number) => Number.isSafeInteger(maxQuantity) ? Math.max(0, Math.min(MAX_QUANTITY_PER_LINE, maxQuantity)) : 0;
const restore = (value: unknown): SavedCart => { const result = savedCartSchema.safeParse(value); return result.success ? result.data : { ...emptyCart }; };
// Storage can be blocked or full. The cart still works in memory for this visit.
const safeStorage: StateStorage = {
  getItem: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  setItem: (key, value) => { try { localStorage.setItem(key, value); } catch { /* Keep the in-memory cart. */ } },
  removeItem: (key) => { try { localStorage.removeItem(key); } catch { /* Storage is unavailable. */ } },
};

export const useCartStore = create<CartState>()(persist((set, get) => ({
  ...emptyCart, hasHydrated: false,
  add: (variantId, quantity, maxQuantity) => {
    if (!get().hasHydrated) return "Giỏ hàng đang tải, vui lòng thử lại.";
    if (!cartLineSchema.safeParse({ variantId, quantity }).success || limit(maxQuantity) < 1) return "Số lượng hoặc sản phẩm không hợp lệ.";
    const existing = get().lines.find((line) => line.variantId === variantId);
    if (!existing && get().lines.length >= MAX_CART_LINES) return `Giỏ hàng có tối đa ${MAX_CART_LINES} dòng sản phẩm.`;
    const next = Math.min((existing?.quantity ?? 0) + quantity, limit(maxQuantity));
    set({ lines: existing ? get().lines.map((line) => line.variantId === variantId ? { variantId, quantity: next } : line) : [...get().lines, { variantId, quantity: next }] });
    return null;
  },
  setQuantity: (variantId, quantity, maxQuantity) => {
    if (!Number.isSafeInteger(quantity) || limit(maxQuantity) < 1) return;
    set({ lines: get().lines.map((line) => line.variantId === variantId ? { variantId, quantity: Math.max(1, Math.min(quantity, limit(maxQuantity))) } : line) });
  },
  remove: (variantId) => set({ lines: get().lines.filter((line) => line.variantId !== variantId) }),
  clear: () => set({ lines: [], note: "", discountCode: "" }),
  setNote: (note) => set({ note: note.slice(0, 500) }),
  setDiscountCode: () => set({ discountCode: "" }),
}), {
  name: "cham-cart-v1", version: 1, skipHydration: true, storage: createJSONStorage(() => safeStorage),
  partialize: ({ lines, note, discountCode }) => ({ lines, note, discountCode }),
  merge: (saved, current) => ({ ...current, ...restore(saved) }),
  migrate: (saved) => restore(saved),
}));

export const cartRequestKey = (lines: CartLineInput[], discountCode: string) => JSON.stringify({ lines, discountCode });
