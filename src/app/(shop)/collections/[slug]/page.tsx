import Link from "next/link";
import { Breadcrumb } from "@/components/shop/common/Breadcrumb";
import { ProductCard } from "@/components/shop/common/product-card";
import { Pagination } from "@/components/shop/common/Pagination";
import { ShopImage } from "@/components/shop/common/shop-image";
import { ListingControls } from "@/components/shop/collection/ListingControls";
import { listingQuery } from "@/lib/listing-url";
import { parseListingFilters } from "@/lib/validation/listing";
import { getListing } from "@/server/services/catalog.service";
import { readCatalogPage } from "../../catalog-boundary";
import { getPageMetadata, getSiteUrl } from "@/server/services/seo.service";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/shop/common/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const listing = await readCatalogPage(() => params.then(({ slug }) => getListing(slug)));
  return getPageMetadata({ title: listing.title, description: listing.description || `Khám phá ${listing.title.toLowerCase()}, xem màu sắc, kích thước và giá sản phẩm tại cửa hàng.`, path: `/collections/${(await params).slug}` });
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const parsed = parseListingFilters(query);
  const listing = await readCatalogPage(() => getListing(slug, parsed));
  const filters = { ...parsed, page: listing.page, sizes: parsed.sizes.filter((size) => listing.facets.sizes.includes(size)), colors: parsed.colors.flatMap((value) => { const color = listing.facets.colors.find((color) => color.code.toLowerCase() === value.toLowerCase()); return color ? [color.code] : []; }) };
  const defaultSort = slug === "new-arrival" ? "newest" : slug === "best-seller" ? "best" : slug === "sale" ? "sale" : "featured";
  const clearQuery = listingQuery({ sizes: [], colors: [], price: null, inStock: false, sort: filters.sort, page: 1 });
  return <div className="shop-container pb-5">
    <JsonLd data={breadcrumbJsonLd(listing.breadcrumb, getSiteUrl())} />
    <Breadcrumb items={listing.breadcrumb} />
    {listing.bannerUrl && <div className="relative mb-9 aspect-[12/5] overflow-hidden bg-image-bg"><ShopImage src={listing.bannerUrl} alt={listing.title} sizes="100vw" className="object-cover" priority /></div>}
    <header className="pt-5 pb-10 text-center"><h1 className="shop-section-title wrap-anywhere">{listing.title}</h1><p className="mt-3 text-xs text-muted">{listing.total} sản phẩm</p>
      {listing.description && <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-sm leading-7 text-muted">{listing.description}</p>}
    </header>
    {listing.subcategories.length > 0 && <nav aria-label="Danh mục con" className="mb-7 flex gap-2 overflow-x-auto pb-2">{listing.subcategories.map((category) => <Link key={category.slug} href={`/collections/${category.slug}`} className="shrink-0 border px-4 py-2 text-xs hover:border-fg">{category.name}</Link>)}</nav>}
    <ListingControls filters={filters} facets={listing.facets} total={listing.total} defaultSort={defaultSort}>
      {listing.products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">{listing.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="py-16 text-center"><h2 className="text-base font-medium">Không tìm thấy sản phẩm phù hợp</h2><Link className="shop-button mt-6" href={`/collections/${slug}${clearQuery ? `?${clearQuery}` : ""}`}>Xóa bộ lọc</Link></div>}
      <Pagination page={listing.page} totalPages={listing.totalPages} pathname={`/collections/${slug}`} query={listingQuery(filters)} />
    </ListingControls>
  </div>;
}
