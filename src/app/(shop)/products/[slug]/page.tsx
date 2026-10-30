import { Breadcrumb } from "@/components/shop/common/Breadcrumb";
import { ProductSection } from "@/components/shop/common/product-card";
import { ProductExperience } from "@/components/shop/product/ProductExperience";
import { ProductInformation, ProductPolicies } from "@/components/shop/product/ProductInformation";
import { SizeChartTable } from "@/components/shop/product/SizeChartTable";
import { getProductDetail, getRelatedProducts } from "@/server/services/catalog.service";
import { getPublicSettings } from "@/server/services/settings.service";
import { readCatalogPage } from "../../catalog-boundary";
import { getPageMetadata, getSiteUrl } from "@/server/services/seo.service";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/shop/common/JsonLd";
export const revalidate = 300;
export async function generateStaticParams() {
  // Generate on first visit, then reuse ISR; builds do not fan out database reads per product.
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await readCatalogPage(() => params.then(({ slug }) => getProductDetail(slug)));
  return getPageMetadata({ title: product.seo.title, description: product.seo.description, path: `/products/${product.slug}`, image: product.images[0]?.url });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await readCatalogPage(() => getProductDetail(slug));
  const [related, settings] = await Promise.all([getRelatedProducts(slug), getPublicSettings()]);
  const breadcrumb = [{ label: "Trang chủ", href: "/" }, ...(product.category.parent ? [{ label: product.category.parent.name, href: `/collections/${product.category.parent.slug}` }] : []), { label: product.category.name, href: `/collections/${product.category.slug}` }, { label: product.name, href: `/products/${product.slug}` }];
  return <>
    <JsonLd data={productJsonLd(product, getSiteUrl())} /><JsonLd data={breadcrumbJsonLd(breadcrumb, getSiteUrl())} />
    <div className="shop-container pb-5"><Breadcrumb items={breadcrumb} />
      <ProductExperience key={product.id} product={product} sizeChart={<SizeChartTable chart={product.sizeChart} />}>
        <ProductPolicies policies={settings.policies} /><ProductInformation product={product} returnPolicySummary={settings.returnPolicySummary} />
      </ProductExperience>
    </div>
    <ProductSection title="SẢN PHẨM LIÊN QUAN" slug={product.category.slug} products={related} />
  </>;
}
