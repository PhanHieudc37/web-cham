"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listingSortSchema, type ListingFilters } from "@/lib/validation/listing";
import { listingQuery } from "@/lib/listing-url";
import { useHydrated } from "@/hooks/use-hydrated";
import type { ListingDTO } from "@/types/dto";
import { FilterFields } from "./FilterFields";

const sortOptions = [["featured", "Nổi bật"], ["newest", "Mới nhất"], ["best", "Bán chạy nhất"], ["price-asc", "Giá: Tăng dần"], ["price-desc", "Giá: Giảm dần"], ["name-asc", "Tên: A-Z"], ["name-desc", "Tên: Z-A"]];
export function ListingControls({ filters, facets, defaultSort, total, children }: {
  filters: ListingFilters; facets: ListingDTO["facets"]; defaultSort: string; total: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const [current, setOptimistic] = useOptimistic(filters, (_previous, next: ListingFilters) => next);
  const pathname = usePathname(), router = useRouter();
  function update(next: ListingFilters) { const normalized = { ...next, page: 1 }; const query = listingQuery(normalized); startTransition(() => { setOptimistic(normalized); router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }); }); }
  function clear() { update({ sizes: [], colors: [], price: null, inStock: false, sort: current.sort, page: 1 }); }
  const fields = { filters: current, facets, update, clear, pending: pending || !hydrated };
  const count = current.sizes.length + current.colors.length + Number(Boolean(current.price)) + Number(current.inStock);
  return <div id="product-grid" className="scroll-mt-28" aria-busy={pending} data-filters-ready={hydrated}>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-x-3 gap-y-4 border-y py-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold tracking-wider lg:hidden"><SlidersHorizontal size={16} />BỘ LỌC{count > 0 ? ` (${count})` : ""}</button></SheetTrigger>
        <SheetContent side="left" className="shop-sheet w-[85%]! max-w-[360px]! overflow-y-auto p-6">
          <SheetTitle className="text-lg font-semibold uppercase tracking-wider">Bộ lọc</SheetTitle><SheetDescription>{total} sản phẩm phù hợp</SheetDescription>
          <div className="mt-5"><FilterFields {...fields} /></div>
          <button type="button" onClick={() => setOpen(false)} className="shop-button shop-button-primary mt-6">XEM {total} SẢN PHẨM</button>
        </SheetContent>
      </Sheet>
      <p className="hidden text-xs text-muted lg:block">{total} sản phẩm</p>
      <div className="ml-auto flex items-center gap-2"><span id="sort-label" className="text-xs text-muted">Sắp xếp theo:</span>
        <Select value={current.sort ?? defaultSort} disabled={pending || !hydrated} onValueChange={(value) => { const parsed = listingSortSchema.safeParse(value); update({ ...current, sort: parsed.success ? parsed.data : undefined }); }}>
          <SelectTrigger aria-labelledby="sort-label" className="h-11 min-w-36 rounded-none text-xs"><SelectValue /></SelectTrigger>
          <SelectContent position="popper" className="rounded-none">{defaultSort === "sale" && <SelectItem value="sale">Giảm giá nhiều nhất</SelectItem>}{sortOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside aria-label="Bộ lọc sản phẩm" className="hidden lg:block"><FilterFields {...fields} /></aside>
      <div className={`min-w-0 transition-opacity ${pending ? "opacity-50" : ""}`}><p role="status" className="sr-only">{pending ? "Đang cập nhật sản phẩm…" : `${total} sản phẩm phù hợp`}</p>{children}</div>
    </div>
  </div>;
}
