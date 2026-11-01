import Link from "next/link";
import { Breadcrumb } from "@/components/shop/common/Breadcrumb";
import { ShopImage } from "@/components/shop/common/shop-image";
import { ListingControls } from "@/components/shop/collection/ListingControls";
import { getListingData, getListingMetadata } from "@/server/services/catalog.service";
import { readCatalogPage } from "../../catalog-boundary";
import { getPageMetadata, getSiteUrl } from "@/server/services/seo.service";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/shop/common/JsonLd";
export const revalidate = 86400;
export async function generateStaticParams() {
  // The all-products listing bounds every smaller collection. Warn at build
  // time as well as on individual ISR reads, without truncating the catalog.
  await getListingData("all");
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const listing = await readCatalogPage(() => params.then(({ slug }) => getListingMetadata(slug)));
  return getPageMetadata({ title: listing.title, description: listing.description || `Khám phá ${listing.title.toLowerCase()}, xem màu sắc, kích thước và giá sản phẩm tại cửa hàng.`, path: `/collections/${(await params).slug}` });
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await readCatalogPage(() => getListingData(slug));
  return <div className="shop-container pb-5">
    <JsonLd data={breadcrumbJsonLd(listing.breadcrumb, getSiteUrl())} />
    <Breadcrumb items={listing.breadcrumb} />
    {listing.bannerUrl && <div className="relative mb-9 aspect-[12/5] overflow-hidden bg-image-bg"><ShopImage src={listing.bannerUrl} alt={listing.title} sizes="100vw" className="object-cover" priority /></div>}
    <ListingControls data={listing}>
    {listing.subcategories.length > 0 && <nav aria-label="Danh mục con" className="mb-7 flex gap-2 overflow-x-auto pb-2">{listing.subcategories.map((category) => <Link prefetch={false} key={category.slug} href={`/collections/${category.slug}`} className="shrink-0 border px-4 py-2 text-xs hover:border-fg">{category.name}</Link>)}</nav>}
    </ListingControls>
  </div>;
}
