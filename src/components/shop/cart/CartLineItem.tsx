"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import type { CartQuoteDTO } from "@/types/dto";
import { ShopImage } from "../common/shop-image";

export function CartLineItem({ line, quantity, reduction, onNavigate }: { line: CartQuoteDTO["lines"][number]; quantity: number; reduction?: number; onNavigate?: () => void }) {
  const unavailable = line.issue === "UNAVAILABLE" || line.issue === "OUT_OF_STOCK";
  const warning = line.issue === "UNAVAILABLE" ? "Sản phẩm đã ngừng bán. Vui lòng xóa khỏi giỏ hàng."
    : line.issue === "OUT_OF_STOCK" ? "Sản phẩm đã hết hàng. Vui lòng xóa khỏi giỏ hàng."
    : line.issue === "QUANTITY_REDUCED" || reduction === quantity ? `Chỉ còn ${line.maxQuantity} sản phẩm. Số lượng đã được cập nhật.` : null;
  function change(value: number) { useCartStore.getState().setQuantity(line.variantId, value, line.maxQuantity); }
  return <li className="flex min-w-0 gap-4 border-b py-5" data-testid="cart-line" data-variant-id={line.variantId}>
    <div className="relative size-20 shrink-0 bg-image-bg"><ShopImage src={line.image?.url ?? null} alt={line.image?.alt ?? line.name} sizes="80px" className="object-contain" /></div>
    <div className="min-w-0 flex-1">
      {line.slug && !unavailable ? <Link href={`/products/${line.slug}`} onClick={onNavigate} className="text-xs leading-6 font-medium wrap-anywhere uppercase hover:underline">{line.name}</Link> : <p className="text-xs leading-6 font-medium wrap-anywhere uppercase">{line.name}</p>}
      {(line.colorName || line.size) && <p className="mt-1 text-xs text-muted">{line.colorName} / {line.size}</p>}
      <p className="mt-2 text-xs" data-testid="cart-unit-price">{formatPrice(line.unitPrice)}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="inline-flex h-9 border">
          <button type="button" aria-label={`Giảm số lượng ${line.name} ${line.colorName} ${line.size}`} disabled={unavailable || quantity <= 1} onClick={() => change(quantity - 1)} className="flex w-9 items-center justify-center disabled:opacity-30"><Minus size={12} /></button>
          <input type="number" aria-label={`Số lượng ${line.name} ${line.colorName} ${line.size}`} min={1} max={line.maxQuantity} disabled={unavailable} value={quantity} onChange={(event) => change(Math.floor(Number(event.target.value)))} className="w-9 min-w-0 bg-transparent text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
          <button type="button" aria-label={`Tăng số lượng ${line.name} ${line.colorName} ${line.size}`} disabled={unavailable || quantity >= line.maxQuantity} onClick={() => change(quantity + 1)} className="flex w-9 items-center justify-center disabled:opacity-30"><Plus size={12} /></button>
        </div>
        <strong className="text-xs" data-testid="cart-line-total">{formatPrice(line.lineTotal)}</strong>
        <button type="button" onClick={() => useCartStore.getState().remove(line.variantId)} className="min-h-9 text-xs text-muted underline underline-offset-4" aria-label={`Xóa ${line.name} ${line.colorName} ${line.size}`}>Xóa</button>
      </div>
      {warning && <p role="status" className="mt-2 text-xs leading-6 text-sale">{warning}</p>}
    </div>
  </li>;
}
