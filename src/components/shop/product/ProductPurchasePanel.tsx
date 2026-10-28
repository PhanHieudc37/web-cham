"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { ProductDetailDTO } from "@/types/dto";
import { PriceTag } from "../common/product-card";
import { ShopImage } from "../common/shop-image";

export function ProductPurchasePanel({ product, colorId, onColorChange, children, sizeChart }: {
  product: ProductDetailDTO; colorId: string; onColorChange: (id: string) => void; children: React.ReactNode; sizeChart: React.ReactNode;
}) {
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const actions = useRef<HTMLDivElement>(null), sizes = useRef<HTMLFieldSetElement>(null);
  const reduced = useReducedMotion();
  const color = product.colorOptions.find((color) => color.id === colorId);
  const variant = product.variants.find((variant) => variant.colorId === colorId && variant.size === size && variant.available);
  const maxQuantity = variant?.maxQuantity ?? 1;
  const soldOut = !product.variants.some((variant) => variant.available);
  useEffect(() => {
    const target = actions.current;
    if (!target) return;
    let frame: number | null = null;
    const update = () => {
      const header = document.getElementById("shop-header")?.getBoundingClientRect().bottom ?? 72;
      setShowSticky(target.getBoundingClientRect().bottom < header);
    };
    // An instant scroll can jump from above to below without crossing an observer threshold.
    const onScroll = () => { if (frame === null) frame = requestAnimationFrame(() => { frame = null; update(); }); };
    const observer = new IntersectionObserver(update, { rootMargin: "-72px 0px 0px 0px" });
    observer.observe(target);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); if (frame !== null) cancelAnimationFrame(frame); };
  }, []);
  function chooseSize(value: string) { setSize(value); setQuantity(1); setSelectionError(false); }
  function requestSelection() { setSelectionError(true); sizes.current?.scrollIntoView({ block: "center", behavior: reduced ? "instant" : "smooth" }); sizes.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true }); }
  const image = product.images.find((image) => image.colorId === colorId) ?? product.image;
  return <div className="min-w-0 lg:sticky lg:top-24">
    <h1 className="text-xl leading-relaxed font-semibold tracking-wide wrap-anywhere uppercase md:text-2xl">{product.name}</h1>
    <p className="mt-2 text-xs wrap-anywhere text-muted" aria-live="polite">SKU: {variant?.sku ?? product.code}</p>
    <div className="mt-5 flex flex-wrap items-center gap-3"><PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />{product.discountPercent !== null && <span className="bg-sale px-2 py-1 text-[10px] font-semibold text-white">-{product.discountPercent}%</span>}</div>
    <fieldset className="mt-7"><legend className="mb-3 text-sm">Màu sắc: <span className="font-medium">{color?.name ?? "Chưa chọn"}</span></legend><div className="flex flex-wrap gap-2">
      {product.colorOptions.map((option) => { const available = product.variants.some((variant) => variant.colorId === option.id && variant.available); return <button type="button" key={option.id} aria-label={`Màu ${option.name}`} aria-pressed={colorId === option.id} disabled={!available} title={available ? option.name : `${option.name} — Hết hàng`} onClick={() => onColorChange(option.id)} className={`flex size-11 items-center justify-center rounded-full border-2 disabled:cursor-not-allowed disabled:opacity-30 ${colorId === option.id ? "border-fg" : "border-transparent"}`}><span className="size-8 rounded-full border border-black/15" style={{ backgroundColor: option.hex }} /></button>; })}
    </div></fieldset>
    <fieldset className="mt-6 scroll-mt-32" ref={sizes}><legend className="mb-3 text-sm">Kích thước: <span className="font-medium">{size || "Chưa chọn"}</span></legend>
      <Dialog><DialogTrigger asChild><button type="button" className="mb-3 min-h-8 text-xs underline underline-offset-4">Hướng dẫn chọn size</button></DialogTrigger>
        <DialogContent className="shop-dialog max-h-[85dvh] overflow-y-auto rounded-none p-6 sm:max-w-2xl"><DialogTitle className="pr-6 text-lg font-semibold uppercase tracking-wider">Hướng dẫn chọn size</DialogTitle><DialogDescription>Tham khảo số đo của sản phẩm để chọn kích thước phù hợp.</DialogDescription>{sizeChart}</DialogContent>
      </Dialog>
      <div className="flex flex-wrap gap-2">{product.sizes.map((option) => { const available = product.variants.some((variant) => variant.colorId === colorId && variant.size === option && variant.available); return <button type="button" key={option} disabled={!available} aria-pressed={size === option} title={available ? option : `${option} — Hết hàng`} onClick={() => chooseSize(option)} className={`relative flex min-h-11 min-w-11 items-center justify-center border px-3 text-xs disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 ${size === option ? "border-fg bg-fg text-white" : ""} ${available ? "" : "sold-out-size"}`}>{option}</button>; })}</div>
    </fieldset>
    <p role="status" className={`mt-5 text-xs ${variant ? "text-success" : soldOut ? "text-muted" : "text-fg"}`}>{soldOut ? "Hết hàng" : variant ? variant.lowStockCount !== null ? `Chỉ còn ${variant.lowStockCount} sản phẩm` : "Còn hàng" : "Chọn kích thước để xem tình trạng còn hàng."}</p>
    {selectionError && !variant && <p role="alert" className="mt-3 text-xs text-sale">Vui lòng chọn màu sắc và kích thước</p>}
    <div className="mt-6 flex items-center gap-4"><label htmlFor="product-quantity" className="text-xs">Số lượng</label><div className="inline-flex h-11 border">
      <button type="button" aria-label="Giảm số lượng" className="shop-icon-button disabled:opacity-30" disabled={!variant || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={14} /></button>
      <input id="product-quantity" type="number" min={1} max={maxQuantity} value={quantity} disabled={!variant} onChange={(event) => { const value = Number(event.target.value); setQuantity(Number.isFinite(value) ? Math.max(1, Math.min(maxQuantity, Math.floor(value))) : 1); }} className="w-11 min-w-0 bg-transparent text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
      <button type="button" aria-label="Tăng số lượng" className="shop-icon-button disabled:opacity-30" disabled={!variant || quantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}><Plus size={14} /></button>
    </div></div>
    <div ref={actions} className="mt-6 space-y-3">
      {soldOut ? <button type="button" disabled className="shop-button w-full opacity-40">HẾT HÀNG</button> : <>
        <button type="button" disabled aria-describedby="purchase-availability" className="shop-button w-full opacity-40">THÊM VÀO GIỎ</button>
        <button type="button" disabled aria-describedby="purchase-availability" className="shop-button shop-button-primary w-full opacity-40">MUA NGAY</button>
        <p id="purchase-availability" className="text-center text-xs leading-6 text-muted">Cửa hàng đang chuẩn bị mở bán.</p>
      </>}
    </div>
    {children}
    {showSticky && <div data-sticky-buy-bar className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
      <div className="relative size-12 shrink-0 bg-image-bg"><ShopImage src={image?.url ?? null} alt="" sizes="48px" className="object-contain" /></div><div className="min-w-0 flex-1"><PriceTag price={product.price} compareAtPrice={product.compareAtPrice} /></div>
      <button type="button" onClick={requestSelection} disabled={soldOut || Boolean(variant)} className="shop-button shop-button-primary shrink-0 px-3 text-[10px] disabled:opacity-40">{soldOut ? "HẾT HÀNG" : "THÊM VÀO GIỎ"}</button>
    </div>}
  </div>;
}
