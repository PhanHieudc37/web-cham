"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { CartLineItem } from "./CartLineItem";

export function CartEmpty({ onNavigate }: { onNavigate?: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center gap-6 px-4 py-12 text-center"><p className="text-sm">Giỏ hàng của bạn đang trống</p><Link href="/collections/all" onClick={onNavigate} className="shop-button shop-button-primary">TIẾP TỤC MUA SẮM</Link></div>;
}
export function CartContents({ onNavigate }: { onNavigate?: () => void }) {
  const lines = useCartStore((state) => state.lines);
  const { quote, pending, error, refresh, reductions } = useCartQuote();
  return <div aria-busy={pending}>
    {error && <div role="alert" className="my-4 border border-sale p-4 text-xs leading-6 text-sale">{error}<button type="button" onClick={refresh} className="ml-3 min-h-9 underline">Thử lại</button></div>}
    {pending && <div role="status" className="flex items-center gap-2 py-3 text-xs text-muted"><span className="size-3 animate-pulse bg-black/15 motion-reduce:animate-none" />Đang cập nhật giá và tồn kho…</div>}
    <ul aria-label="Sản phẩm trong giỏ hàng">{quote?.lines.filter((line) => lines.some((item) => item.variantId === line.variantId)).map((line) => <CartLineItem key={line.variantId} line={line} quantity={lines.find((item) => item.variantId === line.variantId)!.quantity} reduction={reductions[line.variantId]} onNavigate={onNavigate} />)}</ul>
    {pending && lines.filter((line) => !quote?.lines.some((item) => item.variantId === line.variantId)).map((line) => <div key={line.variantId} aria-hidden="true" className="flex gap-4 border-b py-5"><div className="size-20 shrink-0 animate-pulse bg-image-bg" /><div className="flex-1 space-y-4"><div className="h-4 animate-pulse bg-image-bg" /><div className="h-3 w-1/2 animate-pulse bg-image-bg" /></div></div>)}
  </div>;
}
export function CartCheckoutButton() {
  const { ready, quote } = useCartQuote();
  const blocked = !ready || !quote?.itemCount || quote.lines.some((line) => line.issue === "UNAVAILABLE" || line.issue === "OUT_OF_STOCK");
  return <div><button type="button" disabled className="shop-button shop-button-primary w-full opacity-40">THANH TOÁN</button><p role="status" className="mt-3 text-center text-xs leading-6 text-muted">{blocked ? "Vui lòng kiểm tra các dòng sản phẩm và cập nhật giỏ hàng." : "Shop đang chuẩn bị tính năng thanh toán."}</p></div>;
}
