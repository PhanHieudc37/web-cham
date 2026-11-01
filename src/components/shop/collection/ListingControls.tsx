"use client";

import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseListingFilters, listingSortSchema, type ListingFilters } from "@/lib/validation/listing";
import { listingQuery } from "@/lib/listing-url";
import { filterListing } from "@/lib/listing";
import { useHydrated } from "@/hooks/use-hydrated";
import type { CatalogListingDTO } from "@/types/dto";
import { ProductCard } from "../common/product-card";
import { Pagination } from "../common/Pagination";
import { FilterFields } from "./FilterFields";

const sortOptions = [["featured", "Nổi bật"], ["newest", "Mới nhất"], ["best", "Bán chạy nhất"], ["price-asc", "Giá: Tăng dần"], ["price-desc", "Giá: Giảm dần"], ["name-asc", "Tên: A-Z"], ["name-desc", "Tên: Z-A"]];
function ListingView({ data, filters, navigate, children }: { data: CatalogListingDTO; filters: ListingFilters; navigate?: (filters: ListingFilters) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false), hydrated = useHydrated();
  const result = filterListing(data.items, filters, data.facets, data.defaultSort), current = result.filters;
  function update(next: ListingFilters) { navigate?.({ ...next, page: 1 }); }
  function clear() { update({ sizes: [], colors: [], price: null, inStock: false, sort: current.sort, page: 1 }); }
  const fields = { filters: current, facets: data.facets, update, clear, pending: !hydrated || !navigate };
  const count = current.sizes.length + current.colors.length + Number(Boolean(current.price)) + Number(current.inStock);
  return <>
    <header className="pt-5 pb-10 text-center"><h1 className="shop-section-title wrap-anywhere">{data.title}</h1><p className="mt-3 text-xs text-muted">{result.total} sản phẩm</p>
      {data.description && <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-sm leading-7 text-muted">{data.description}</p>}
    </header>
    {children}
    <div id="product-grid" className="scroll-mt-28" data-filters-ready={hydrated && Boolean(navigate)}>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-x-3 gap-y-4 border-y py-4">
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold tracking-wider lg:hidden"><SlidersHorizontal size={16} />BỘ LỌC{count > 0 ? ` (${count})` : ""}</button></SheetTrigger>
          <SheetContent side="left" className="shop-sheet w-[85%]! max-w-[360px]! overflow-y-auto p-6"><SheetTitle className="text-lg font-semibold uppercase tracking-wider">Bộ lọc</SheetTitle><SheetDescription>{result.total} sản phẩm phù hợp</SheetDescription>
            <div className="mt-5"><FilterFields {...fields} /></div><button type="button" onClick={() => setOpen(false)} className="shop-button shop-button-primary mt-6">XEM {result.total} SẢN PHẨM</button>
          </SheetContent></Sheet>
        <p className="hidden text-xs text-muted lg:block">{result.total} sản phẩm</p>
        <div className="ml-auto flex items-center gap-2"><span id="sort-label" className="text-xs text-muted">Sắp xếp theo:</span><Select value={current.sort ?? data.defaultSort} disabled={fields.pending} onValueChange={(value) => { const parsed = listingSortSchema.safeParse(value); update({ ...current, sort: parsed.success ? parsed.data : undefined }); }}>
          <SelectTrigger aria-labelledby="sort-label" className="h-11 min-w-36 rounded-none text-xs"><SelectValue /></SelectTrigger><SelectContent position="popper" className="rounded-none">{data.defaultSort === "sale" && <SelectItem value="sale">Giảm giá nhiều nhất</SelectItem>}{sortOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select></div>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]"><aside aria-label="Bộ lọc sản phẩm" className="hidden lg:block"><FilterFields {...fields} /></aside>
        <div className="min-w-0"><p role="status" className="sr-only">{result.total} sản phẩm phù hợp</p>
          {result.products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">{result.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
            : <div className="py-16 text-center"><h2 className="text-base font-medium">Không tìm thấy sản phẩm phù hợp</h2><button type="button" onClick={clear} className="shop-button mt-6">Xóa bộ lọc</button></div>}
          <Pagination page={result.page} totalPages={result.totalPages} pathname="" query={listingQuery(current)} onPageChange={(page) => { navigate?.({ ...current, page }); document.getElementById("product-grid")?.scrollIntoView({ block: "start" }); }} />
        </div>
      </div>
    </div>
  </>;
}
function UrlListing({ data, children }: { data: CatalogListingDTO; children: React.ReactNode }) {
  const params = useSearchParams(), pathname = usePathname();
  const filters = parseListingFilters(Object.fromEntries(params));
  return <ListingView data={data} filters={filters} navigate={(next) => {
    const query = listingQuery(next);
    // Next's History integration updates useSearchParams without an RSC request.
    window.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}${next.page > 1 ? "#product-grid" : ""}`);
  }}>{children}</ListingView>;
}
export function ListingControls({ data, children }: { data: CatalogListingDTO; children: React.ReactNode }) {
  // The server fallback contains the first 12 real cards for SEO and no-JS visitors.
  return <Suspense fallback={<ListingView data={data} filters={parseListingFilters({})}>{children}</ListingView>}><UrlListing data={data}>{children}</UrlListing></Suspense>;
}
