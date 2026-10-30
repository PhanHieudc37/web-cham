import "server-only";

import type { Metadata, MetadataRoute } from "next";
import { and, eq, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { absoluteUrl, AUTOMATIC_COLLECTIONS, PUBLIC_PAGES } from "@/lib/seo";
import { cached, CACHE_TAGS } from "@/server/cache";
import { getDatabase, type DatabaseReader } from "@/server/db/client";
import { categories, collections, products } from "@/server/db/schema";
import { getPublicSettings } from "./settings.service";

export function getSiteUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) throw new Error("Thiếu NEXT_PUBLIC_SITE_URL");
  return new URL("/", site).toString();
}
export async function getPageMetadata({ title, description, path, image, noindex = false }: { title?: string; description?: string; path: string; image?: string | null; noindex?: boolean }): Promise<Metadata> {
  const settings = await getPublicSettings(), site = getSiteUrl();
  const pageTitle = title ? (title.includes(settings.shop.name) ? title : `${title} | ${settings.shop.name}`) : settings.seo.defaultTitle;
  const pageDescription = description || settings.seo.defaultDescription || settings.shop.description || `Khám phá sản phẩm quần áo tại ${settings.shop.name}. Xem màu sắc, bảng size và đặt hàng trực tiếp tại cửa hàng online.`;
  const pageImage = image || settings.seo.ogImageUrl;
  return { metadataBase: new URL(site), title: pageTitle, description: pageDescription, alternates: { canonical: absoluteUrl(path.split("?")[0], site) },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { type: "website", locale: "vi_VN", siteName: settings.shop.name, title: pageTitle, description: pageDescription, url: absoluteUrl(path.split("?")[0], site), ...(pageImage ? { images: [{ url: absoluteUrl(pageImage, site), alt: title || settings.shop.name }] } : {}) },
    twitter: { card: pageImage ? "summary_large_image" : "summary", title: pageTitle, description: pageDescription, ...(pageImage ? { images: [absoluteUrl(pageImage, site)] } : {}) } };
}
export async function readSitemap(reader: DatabaseReader, site: string): Promise<MetadataRoute.Sitemap> {
  const parent = alias(categories, "seo_parent");
  const visible = and(eq(categories.isActive, true), or(isNull(parent.id), eq(parent.isActive, true)));
  const [categoryRows, collectionRows, productRows] = await Promise.all([
    reader.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).leftJoin(parent, eq(parent.id, categories.parentId)).where(visible),
    reader.select({ slug: collections.slug, updatedAt: collections.updatedAt }).from(collections).where(eq(collections.isActive, true)),
    reader.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).innerJoin(categories, eq(categories.id, products.categoryId)).leftJoin(parent, eq(parent.id, categories.parentId)).where(and(eq(products.status, "active"), visible)),
  ]);
  const rows: MetadataRoute.Sitemap = PUBLIC_PAGES.map((path) => ({ url: absoluteUrl(path, site) }));
  for (const slug of AUTOMATIC_COLLECTIONS) rows.push({ url: absoluteUrl(`/collections/${slug}`, site) });
  for (const row of [...categoryRows, ...collectionRows]) rows.push({ url: absoluteUrl(`/collections/${encodeURIComponent(row.slug)}`, site), lastModified: row.updatedAt });
  for (const row of productRows) rows.push({ url: absoluteUrl(`/products/${encodeURIComponent(row.slug)}`, site), lastModified: row.updatedAt });
  return [...new Map(rows.map((row) => [row.url, row])).values()].sort((a, b) => a.url.localeCompare(b.url));
}
export const getSitemap = cached(async () => readSitemap(getDatabase(), getSiteUrl()), ["public-sitemap"], [CACHE_TAGS.products, CACHE_TAGS.categories, CACHE_TAGS.collections]);
