"use client";

import Link from "next/link";
import { useRef } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { formatPrice } from "@/lib/format";
import { CartCheckoutButton, CartContents, CartEmpty } from "./CartContents";
import { FreeShipProgress } from "./FreeShipProgress";

export function CartDrawer() {
  const open = useUiStore((state) => state.cartOpen), hydrated = useCartStore((state) => state.hasHydrated);
  const lines = useCartStore((state) => state.lines), { quote, pending } = useCartQuote();
  const lastFocus = useRef<HTMLElement | null>(null);
  const close = () => useUiStore.getState().setCartOpen(false);
  if (!hydrated) return null;
  return <Sheet open={open} onOpenChange={(open) => useUiStore.getState().setCartOpen(open)}>
    <SheetContent id="shop-cart-drawer" className="shop-sheet w-full! max-w-none! gap-0 p-0 sm:max-w-[420px]!" onOpenAutoFocus={() => { lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={(event) => { event.preventDefault(); if (lastFocus.current?.isConnected) lastFocus.current.focus(); else document.querySelector<HTMLButtonElement>('[aria-label="Mở giỏ hàng"]')?.focus(); }}>
      <div className="border-b p-6"><SheetTitle className="pr-8 text-base tracking-wider">GIỎ HÀNG ({lines.reduce((sum, line) => sum + line.quantity, 0)})</SheetTitle><SheetDescription className="sr-only">Kiểm tra sản phẩm, số lượng và giá mới nhất</SheetDescription></div>
      {!lines.length ? <CartEmpty onNavigate={close} /> : <>
        {quote && <FreeShipProgress quote={quote} />}
        <div className="min-h-0 flex-1 overflow-y-auto px-6"><CartContents onNavigate={close} /></div>
        <div className="shrink-0 border-t p-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          <div className="mb-5 flex justify-between gap-4 text-sm font-semibold" aria-busy={pending}><span>TỔNG TIỀN</span><span data-testid="drawer-total">{quote ? formatPrice(quote.total) : "—"}</span></div>
          <Link href="/cart" onClick={close} className="shop-button mb-3 w-full">XEM GIỎ HÀNG</Link><CartCheckoutButton />
        </div>
      </>}
    </SheetContent>
  </Sheet>;
}
