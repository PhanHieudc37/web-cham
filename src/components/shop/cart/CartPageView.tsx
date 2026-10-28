"use client";

import { useCartStore } from "@/store/cart";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { formatPrice } from "@/lib/format";
import { CartCheckoutButton, CartContents, CartEmpty } from "./CartContents";
import { FreeShipProgress } from "./FreeShipProgress";

export function CartPageView() {
  const hydrated = useCartStore((state) => state.hasHydrated), lines = useCartStore((state) => state.lines), note = useCartStore((state) => state.note);
  const { quote, pending, refresh } = useCartQuote();
  if (!hydrated) return <div role="status" className="my-10 h-40 animate-pulse bg-image-bg p-6 text-sm">Đang tải giỏ hàng…</div>;
  if (!lines.length) return <CartEmpty />;
  return <div className="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
    <div className="min-w-0"><CartContents /><label htmlFor="cart-note" className="mt-8 block text-sm font-medium">Ghi chú đơn hàng</label><textarea id="cart-note" rows={4} maxLength={500} value={note} onChange={(event) => useCartStore.getState().setNote(event.target.value)} className="mt-3 w-full resize-y border p-3 text-sm" /><p className="mt-1 text-right text-xs text-muted">{note.length}/500</p></div>
    <aside aria-label="Tóm tắt giỏ hàng" className="min-w-0 border lg:sticky lg:top-24">
      {quote && <FreeShipProgress quote={quote} />}
      <div className="space-y-5 p-6" aria-busy={pending}>
        <h2 className="text-sm font-semibold tracking-wider">TÓM TẮT ĐƠN HÀNG</h2>
        <dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt>Tạm tính</dt><dd data-testid="cart-subtotal">{quote ? formatPrice(quote.subtotal) : "—"}</dd></div><div className="flex justify-between gap-4"><dt>Phí vận chuyển</dt><dd data-testid="cart-shipping">{quote ? quote.shippingFee === 0 ? "Miễn phí" : formatPrice(quote.shippingFee) : "—"}</dd></div><div className="flex justify-between gap-4 border-t pt-5 font-semibold"><dt>Tổng cộng</dt><dd data-testid="cart-total">{quote ? formatPrice(quote.total) : "—"}</dd></div></dl>
        <button type="button" onClick={refresh} disabled={pending} className="min-h-9 text-xs underline underline-offset-4 disabled:opacity-40">Cập nhật giỏ hàng</button><CartCheckoutButton />
      </div>
    </aside>
  </div>;
}
