"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ActionResult } from "@/lib/result";
import type { ProductCardDTO } from "@/types/dto";
import { ShopImage } from "../common/shop-image";
import { PriceTag } from "../common/product-card";

function Suggestions({ query, close }: { query: string; close: () => void }) {
  const [result, setResult] = useState<ActionResult<ProductCardDTO[]> | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data: ActionResult<ProductCardDTO[]> = await response.json();
        if (!controller.signal.aborted) setResult(data);
      } catch {
        if (!controller.signal.aborted) setResult({ ok: false, error: { code: "INTERNAL", message: "Không tải được gợi ý. Vui lòng thử lại." } });
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  if (!result) return <p role="status" className="py-6 text-sm text-muted">Đang tìm sản phẩm…</p>;
  if (!result.ok) return <p role="status" className="py-6 text-sm text-sale">{result.error.message}</p>;
  return <>
    <p role="status" className="mt-4 text-xs text-muted">{result.data.length ? "Gợi ý sản phẩm" : "Không tìm thấy sản phẩm phù hợp."}</p>
    <ul className="mt-3 grid gap-x-8 md:grid-cols-2">
      {result.data.map((product) => <li key={product.id}><Link href={`/products/${product.slug}`} onClick={close} className="flex min-h-24 items-center gap-4 border-b py-3">
        <div className="relative size-16 shrink-0 bg-image-bg"><ShopImage src={product.image?.url ?? null} alt={product.image?.alt || product.name} sizes="64px" className="object-contain" /></div>
        <div className="min-w-0"><p className="mb-2 line-clamp-2 text-xs font-medium uppercase">{product.name}</p><PriceTag price={product.price} compareAtPrice={product.compareAtPrice} /></div>
      </Link></li>)}
    </ul>
    <Link href={`/search?q=${encodeURIComponent(query)}`} onClick={close} className="shop-button mt-6">XEM TẤT CẢ KẾT QUẢ</Link>
  </>;
}

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [top, setTop] = useState(64);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  function changeOpen(value: boolean) {
    if (value) setTop(document.getElementById("shop-header")?.getBoundingClientRect().bottom ?? 64);
    setOpen(value);
    if (!value) setQuery("");
  }
  return <Sheet open={open} onOpenChange={changeOpen}>
    <SheetTrigger asChild><button type="button" className="shop-icon-button" aria-label="Mở tìm kiếm"><Search size={20} strokeWidth={1.5} /></button></SheetTrigger>
    <SheetContent side="top" className="shop-sheet gap-0 overflow-y-auto p-0" style={{ top, maxHeight: `calc(100dvh - ${top}px)` }} onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }}>
      <div className="shop-container w-full py-7 md:py-9">
        <SheetTitle className="mb-1 text-lg font-semibold uppercase tracking-wider">Tìm kiếm</SheetTitle>
        <SheetDescription className="mb-5 text-xs">Nhập tên sản phẩm bạn muốn tìm.</SheetDescription>
        <form role="search" onSubmit={(event) => { event.preventDefault(); if (query.trim().length < 2) return; router.push(`/search?q=${encodeURIComponent(query.trim())}`); changeOpen(false); }}>
          <label htmlFor="shop-search" className="sr-only">Tìm kiếm sản phẩm</label>
          <div className="flex border-b border-fg">
            <input id="shop-search" ref={input} type="search" autoComplete="off" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm sản phẩm..." className="h-12 w-full min-w-0 bg-transparent pr-3 text-base outline-none focus-visible:outline-offset-0" />
            <button type="submit" aria-label="Tìm kiếm" className="shop-icon-button"><Search size={20} /></button>
          </div>
        </form>
        {query.trim().length >= 2 ? <Suggestions key={query.trim()} query={query.trim()} close={() => changeOpen(false)} /> : <p className="mt-5 text-xs text-muted">Nhập ít nhất 2 ký tự để xem gợi ý.</p>}
      </div>
    </SheetContent>
  </Sheet>;
}
