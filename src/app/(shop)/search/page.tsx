import { Search } from "lucide-react";
import { Breadcrumb } from "@/components/shop/common/Breadcrumb";
import { Pagination } from "@/components/shop/common/Pagination";
import { ProductCard, ProductSection } from "@/components/shop/common/product-card";
import { parseListingFilters } from "@/lib/validation/listing";
import { getListing, searchProducts } from "@/server/services/catalog.service";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const results = await searchProducts(query, parseListingFilters(params).page);
  const suggested = results.total === 0 ? (await getListing("best-seller")).products.slice(0, 4) : [];
  return <div className="shop-container pb-5">
    <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tìm kiếm", href: "/search" }]} />
    <header className="mx-auto max-w-2xl pt-5 pb-10 text-center"><h1 className="shop-section-title">Tìm kiếm sản phẩm</h1>
      <form action="/search" method="get" role="search" className="mt-7 flex border-b border-fg">
        <label htmlFor="search-page-query" className="sr-only">Từ khóa tìm kiếm</label><input id="search-page-query" name="q" type="search" defaultValue={query} key={query} maxLength={200} placeholder="Bạn đang tìm sản phẩm nào?" className="h-14 w-full min-w-0 bg-transparent px-2 text-base" />
        <button type="submit" className="shop-icon-button my-auto" aria-label="Tìm sản phẩm"><Search size={21} /></button>
      </form>
      <p className="mt-6 text-sm wrap-anywhere">{query ? `Có ${results.total} kết quả cho “${query}”` : "Nhập từ 2 ký tự để tìm sản phẩm."}</p>
    </header>
    <div id="product-grid" className="scroll-mt-28">
      {results.products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">{results.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border-y py-12 text-center"><h2 className="text-base font-medium">Không tìm thấy sản phẩm nào</h2><p className="mt-3 text-sm text-muted">Bạn có thể thử từ khóa khác hoặc xem các sản phẩm bán chạy bên dưới.</p></div>}
      <Pagination page={results.page} totalPages={results.totalPages} pathname="/search" query={new URLSearchParams({ q: query }).toString()} />
    </div>
    <ProductSection title="BEST SELLER" slug="best-seller" products={suggested} />
  </div>;
}
