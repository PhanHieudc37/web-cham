"use client";

import Link from "next/link";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { formatPrice } from "@/lib/format";
import { ShopImage } from "../common/shop-image";

function SummaryContent() {
  const { quote, pending, error } = useCartQuote();
  return <div className="space-y-5 p-5" aria-busy={pending}>
    {pending && <p role="status" className="text-xs text-muted">Đang cập nhật giá và tồn kho…</p>}
    {error && <p role="alert" className="text-xs leading-6 text-sale">{error}</p>}
    <ul className="space-y-5">{quote?.lines.map((line) => <li key={line.variantId} className="flex min-w-0 gap-3"><div className="relative size-16 shrink-0 bg-image-bg"><ShopImage src={line.image?.url ?? null} alt={line.name} sizes="64px" className="object-contain" /></div><div className="min-w-0 flex-1 text-xs leading-6"><p className="font-medium wrap-anywhere uppercase">{line.name}</p><p className="text-muted">{line.colorName} / {line.size} × {line.quantity}</p><p>{formatPrice(line.lineTotal)}</p>{line.issue && <p className="text-sale">{line.issue === "UNAVAILABLE" ? "Sản phẩm đã ngừng bán" : line.issue === "OUT_OF_STOCK" ? "Sản phẩm đã hết hàng" : `Chỉ còn ${line.maxQuantity} sản phẩm`}</p>}</div></li>)}</ul>
    <dl className="space-y-3 border-t pt-5 text-sm"><div className="flex justify-between gap-4"><dt>Tạm tính</dt><dd>{quote ? formatPrice(quote.subtotal) : "—"}</dd></div><div className="flex justify-between gap-4"><dt>Phí vận chuyển</dt><dd>{quote ? quote.shippingFee === 0 ? "Miễn phí" : formatPrice(quote.shippingFee) : "—"}</dd></div><div className="flex justify-between gap-4 border-t pt-4 font-semibold"><dt>Tổng cộng</dt><dd data-testid="checkout-total">{quote ? formatPrice(quote.total) : "—"}</dd></div></dl>
    <Link href="/cart" className="inline-block min-h-9 text-xs underline underline-offset-4">Chỉnh sửa giỏ hàng</Link>
  </div>;
}
export function OrderSummary() {
  const { quote } = useCartQuote();
  return <aside aria-label="Tóm tắt đơn hàng" className="min-w-0 lg:sticky lg:top-6">
    <details className="border lg:hidden"><summary className="flex cursor-pointer list-none flex-wrap justify-between gap-3 bg-image-bg p-5 text-xs font-medium"><span>Xem tóm tắt đơn hàng ▾</span><span>{quote ? formatPrice(quote.total) : "—"}</span></summary><SummaryContent /></details>
    <div className="hidden border lg:block"><h2 className="border-b bg-image-bg p-5 text-sm font-semibold tracking-wider">ĐƠN HÀNG CỦA BẠN</h2><SummaryContent /></div>
  </aside>;
}
