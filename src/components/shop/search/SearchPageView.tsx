"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useSearchIndex } from "@/hooks/use-search-index";
import { searchIndex } from "@/lib/search";
import { parseListingFilters } from "@/lib/validation/listing";
import type { ProductCardDTO } from "@/types/dto";
import { Breadcrumb } from "../common/Breadcrumb";
import { ProductCard, ProductSection } from "../common/product-card";
import { Pagination } from "../common/Pagination";

function SearchView({ query = "", requestedPage = 1, suggested }: { query?: string; requestedPage?: number; suggested: ProductCardDTO[] }) {
  const [input, setInput] = useState(query);
  const { items, error } = useSearchIndex();
  const results = searchIndex(items ?? [], query, requestedPage);
  function navigate(q: string, page = 1) {
    const params = new URLSearchParams({ q });
    if (page > 1) params.set("page", String(page));
    window.history.replaceState(null, "", `/search?${params}`);
  }
  return <div className="shop-container pb-5"><Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tìm kiếm", href: "/search" }]} />
    <header className="mx-auto max-w-2xl pt-5 pb-10 text-center"><h1 className="shop-section-title">Tìm kiếm sản phẩm</h1>
      <form action="/search" role="search" className="mt-7 flex border-b border-fg" onSubmit={(event) => { event.preventDefault(); navigate(input.trim().slice(0, 200)); }}>
        <label htmlFor="search-page-query" className="sr-only">Từ khóa tìm kiếm</label><input id="search-page-query" name="q" type="search" maxLength={200} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Bạn đang tìm sản phẩm nào?" className="h-14 w-full min-w-0 bg-transparent px-2 text-base" />
        <button type="submit" className="shop-icon-button my-auto" aria-label="Tìm sản phẩm"><Search size={21} /></button>
      </form><p className="mt-6 text-sm wrap-anywhere" role="status">{error ? "Không tải được danh sách sản phẩm. Vui lòng tải lại trang." : !items ? "Đang tải danh sách sản phẩm…" : query ? `Có ${results.total} kết quả cho “${query}”` : "Nhập từ 2 ký tự để tìm sản phẩm."}</p>
    </header><div id="product-grid" className="scroll-mt-28">
      {results.products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">{results.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        : items && <div className="border-y py-12 text-center"><h2 className="text-base font-medium">Không tìm thấy sản phẩm nào</h2><p className="mt-3 text-sm text-muted">Bạn có thể thử từ khóa khác hoặc xem các sản phẩm bán chạy bên dưới.</p></div>}
      <Pagination page={results.page} totalPages={results.totalPages} pathname="/search" query={new URLSearchParams({ q: query }).toString()} onPageChange={(page) => navigate(query, page)} />
    </div>{!results.total && <ProductSection title="BEST SELLER" slug="best-seller" products={suggested} />}
  </div>;
}
function SearchFromUrl({ suggested }: { suggested: ProductCardDTO[] }) {
  const params = useSearchParams(), query = (params.get("q") ?? "").trim().slice(0, 200);
  return <SearchView key={query} query={query} requestedPage={parseListingFilters(Object.fromEntries(params)).page} suggested={suggested} />;
}
export function SearchPageView({ suggested }: { suggested: ProductCardDTO[] }) {
  return <Suspense fallback={<SearchView suggested={suggested} />}><SearchFromUrl suggested={suggested} /></Suspense>;
}
