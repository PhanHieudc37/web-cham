"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";

export function CartTrigger() {
  const hydrated = useCartStore((state) => state.hasHydrated), lines = useCartStore((state) => state.lines);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const open = useUiStore((state) => state.cartOpen);
  return <button type="button" className="shop-icon-button relative" aria-label="Mở giỏ hàng" aria-haspopup="dialog" aria-expanded={open} aria-controls="shop-cart-drawer" disabled={!hydrated} data-cart-ready={hydrated} onClick={() => useUiStore.getState().setCartOpen(true)}>
    <ShoppingBag size={20} strokeWidth={1.5} />
    {hydrated && count > 0 && <span data-testid="cart-count" className="absolute top-0 right-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-fg px-1 text-[9px] text-white">{count}</span>}
  </button>;
}
