import "server-only";

import { cache } from "react";
import { and, asc, count, desc, eq, exists, gt, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { PAGE_SIZE } from "@/lib/constants";
import { discountPercent } from "@/lib/domain/pricing";
import { sortSizes } from "@/lib/domain/sizes";
import { variantAvailability } from "@/lib/domain/variants";
import { normalizeVietnamese } from "@/lib/normalize";
import { parseListingFilters, type ListingFilters } from "@/lib/validation/listing";
import type { HomeDTO, MenuDTO, ListingDTO, ProductCardDTO, ProductDetailDTO } from "@/types/dto";
import { cached, CACHE_TAGS } from "@/server/cache";
import { getDatabase, type DatabaseReader } from "@/server/db/client";
import { banners, categories, collectionProducts, collections, productColors, productImages, products, productVariants, sizeCharts } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { readSettings } from "./settings.service";

const parent = alias(categories, "catalog_parent");
type ProductRow = typeof products.$inferSelect;
const emptyFilters = () => parseListingFilters({});
const titles: Record<string, string> = { all: "TẤT CẢ SẢN PHẨM", "new-arrival": "NEW ARRIVAL", "best-seller": "BEST SELLER", sale: "SALE" };

export function createCatalogService(reader: DatabaseReader) {
  const visible = and(eq(products.status, "active"), eq(categories.isActive, true), or(isNull(parent.id), eq(parent.isActive, true)));
  const stockExists = exists(reader.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.productId, products.id), eq(productVariants.isActive, true), gt(productVariants.stock, 0))));
  const soldOut = sql<boolean>`not (${stockExists})`;
  const base = () => reader.select({ product: products, soldOut }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parent, eq(categories.parentId, parent.id));

  async function cards(rows: { product: ProductRow; soldOut: boolean }[]): Promise<ProductCardDTO[]> {
    if (!rows.length) return [];
    const ids = rows.map(({ product }) => product.id);
    const [images, colors] = await Promise.all([
      reader.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
      reader.select().from(productColors).where(inArray(productColors.productId, ids)).orderBy(asc(productColors.sortOrder), asc(productColors.id)),
    ]);
    return rows.map(({ product, soldOut: isSoldOut }) => {
      const photos = images.filter((image) => image.productId === product.id);
      const imageDTO = (image: typeof photos[number] | undefined) => image ? { url: image.url, alt: image.alt } : null;
      return { id: product.id, slug: product.slug, name: product.name, price: product.price, compareAtPrice: product.compareAtPrice, discountPercent: discountPercent(product.price, product.compareAtPrice),
        image: imageDTO(photos[0]), hoverImage: imageDTO(photos[1]), colors: colors.filter((color) => color.productId === product.id).map(({ name, hex }) => ({ name, hex })), isNew: product.isNew, isSoldOut };
    });
  }

  async function context(slug: string) {
    const conditions: (SQL | undefined)[] = [visible];
    let title = titles[slug], description: string | null = null, bannerUrl: string | null = null;
    let defaultSort = "featured";
    let manualId: string | null = null;
    const breadcrumb: ListingDTO["breadcrumb"] = [{ label: "Trang chủ", href: "/" }];
    let subcategories: ListingDTO["subcategories"] = [];
    if (title) {
      if (slug === "new-arrival") { conditions.push(or(eq(products.isNew, true), gte(products.publishedAt, new Date(Date.now() - 30 * 86400000)))); defaultSort = "newest"; }
      if (slug === "best-seller") { conditions.push(or(eq(products.isBestSeller, true), gt(products.soldCount, 0))); defaultSort = "best"; }
      if (slug === "sale") { conditions.push(gt(products.compareAtPrice, products.price)); defaultSort = "sale"; }
    } else {
      const [category] = await reader.select().from(categories).where(and(eq(categories.slug, slug), eq(categories.isActive, true)));
      if (category) {
        title = category.name;
        const [ancestor] = category.parentId ? await reader.select().from(categories).where(eq(categories.id, category.parentId)) : [];
        if (ancestor && !ancestor.isActive) throw new AppError("NOT_FOUND");
        if (ancestor) breadcrumb.push({ label: ancestor.name, href: `/collections/${ancestor.slug}` });
        const children = await reader.select().from(categories).where(and(eq(categories.parentId, category.id), eq(categories.isActive, true))).orderBy(asc(categories.sortOrder));
        conditions.push(inArray(products.categoryId, [category.id, ...children.map((child) => child.id)]));
        subcategories = children.map(({ name, slug: childSlug }) => ({ name, slug: childSlug }));
      } else {
        const [collection] = await reader.select().from(collections).where(and(eq(collections.slug, slug), eq(collections.isActive, true)));
        if (!collection) throw new AppError("NOT_FOUND");
        title = collection.title; description = collection.description; bannerUrl = collection.bannerUrl; manualId = collection.id;
        conditions.push(exists(reader.select().from(collectionProducts).where(and(eq(collectionProducts.productId, products.id), eq(collectionProducts.collectionId, collection.id)))));
      }
    }
    breadcrumb.push({ label: title, href: `/collections/${slug}` });
    return { conditions, title, description, bannerUrl, breadcrumb, subcategories, defaultSort, manualId };
  }

  function filtering(filters: ListingFilters) {
    const conditions: (SQL | undefined)[] = [];
    // Color and size must match the same active variant.
    if (filters.sizes.length || filters.colors.length) conditions.push(exists(reader.select({ id: productVariants.id }).from(productVariants)
      .innerJoin(productColors, eq(productVariants.colorId, productColors.id)).where(and(eq(productVariants.productId, products.id), eq(productVariants.isActive, true),
        filters.sizes.length ? inArray(productVariants.size, filters.sizes) : undefined,
        filters.colors.length ? inArray(sql`lower(${productColors.code})`, filters.colors.map((color) => color.toLowerCase())) : undefined))));
    if (filters.price === "under-200") conditions.push(lt(products.price, 200000));
    if (filters.price === "200-400") conditions.push(and(gte(products.price, 200000), lte(products.price, 400000)));
    if (filters.price === "over-400") conditions.push(gt(products.price, 400000));
    if (filters.inStock) conditions.push(stockExists);
    return conditions;
  }

  function sorting(sort: string, manualId: string | null): SQL[] {
    const secondary: SQL[] = [];
    if (sort === "price-asc") secondary.push(asc(products.price));
    else if (sort === "price-desc") secondary.push(desc(products.price));
    else if (sort === "name-asc") secondary.push(asc(products.slug));
    else if (sort === "name-desc") secondary.push(desc(products.slug));
    else if (sort === "newest") secondary.push(sql`${products.publishedAt} DESC NULLS LAST`);
    else if (sort === "best") secondary.push(desc(products.isBestSeller), desc(products.soldCount));
    else if (sort === "sale") secondary.push(sql`(1 - ${products.price}::numeric / nullif(${products.compareAtPrice}, 0)) DESC NULLS LAST`);
    else {
      if (manualId) secondary.push(sql`(SELECT cp.sort_order FROM collection_products cp WHERE cp.product_id = ${products.id} AND cp.collection_id = ${manualId}) ASC NULLS LAST`);
      secondary.push(asc(products.sortOrder), sql`${products.publishedAt} DESC NULLS LAST`);
    }
    return [asc(soldOut), ...secondary, asc(products.id)];
  }

  async function facets(conditions: (SQL | undefined)[]): Promise<ListingDTO["facets"]> {
    const rows = await reader.selectDistinct({ size: productVariants.size, code: productColors.code, name: productColors.name, hex: productColors.hex })
      .from(products).innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parent, eq(categories.parentId, parent.id))
      .innerJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.isActive, true)))
      .innerJoin(productColors, eq(productVariants.colorId, productColors.id)).where(and(...conditions));
    return { sizes: sortSizes(rows.map((row) => row.size)), colors: [...new Map(rows.map(({ code, name, hex }) => [code, { code, name, hex }])).values()].sort((a, b) => a.name.localeCompare(b.name, "vi")) };
  }

  async function getListing(slug: string, filters = emptyFilters()): Promise<ListingDTO> {
    const scope = await context(slug);
    const availableFacets = await facets(scope.conditions);
    const effectiveFilters = { ...filters, sizes: filters.sizes.filter((size) => availableFacets.sizes.includes(size)),
      colors: filters.colors.filter((color) => availableFacets.colors.some((option) => option.code.toLowerCase() === color.toLowerCase())) };
    const conditions = and(...scope.conditions, ...filtering(effectiveFilters));
    const totals = await reader.select({ total: count() }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parent, eq(categories.parentId, parent.id)).where(conditions);
    const total = totals[0].total, totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE)), page = Math.min(filters.page, totalPages);
    const rows = await base().where(conditions).orderBy(...sorting(filters.sort ?? scope.defaultSort, scope.manualId)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
    return { title: scope.title, description: scope.description, bannerUrl: scope.bannerUrl, breadcrumb: scope.breadcrumb, subcategories: scope.subcategories,
      facets: availableFacets, products: await cards(rows), total, page, totalPages };
  }

  async function search(query: string, requestedPage = 1) {
    const normalized = normalizeVietnamese(query).slice(0, 200);
    if (normalized.length < 2) return { products: [] as ProductCardDTO[], total: 0, page: 1, totalPages: 1 };
    const conditions = and(visible, ...normalized.split(" ").map((word) => ilike(products.searchText, `%${word.replace(/[\\%_]/g, "\\$&")}%`)));
    const [totals] = await reader.select({ total: count() }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parent, eq(categories.parentId, parent.id)).where(conditions);
    const totalPages = Math.max(1, Math.ceil(totals.total / PAGE_SIZE)), page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), totalPages);
    const rows = await base().where(conditions).orderBy(asc(soldOut), desc(sql`similarity(${products.searchText}, ${normalized})`), desc(products.soldCount), asc(products.id)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
    return { products: await cards(rows), total: totals.total, page, totalPages };
  }

  async function getProductDetail(slug: string): Promise<ProductDetailDTO> {
    const [row] = await base().where(and(visible, eq(products.slug, slug)));
    if (!row) throw new AppError("NOT_FOUND");
    const product = row.product;
    const [[card], images, colors, variants, config, [category], charts] = await Promise.all([
      cards([row]), reader.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
      reader.select().from(productColors).where(eq(productColors.productId, product.id)).orderBy(asc(productColors.sortOrder), asc(productColors.id)),
      reader.select().from(productVariants).where(eq(productVariants.productId, product.id)), readSettings(reader),
      reader.select().from(categories).where(eq(categories.id, product.categoryId)), product.sizeChartId ? reader.select().from(sizeCharts).where(eq(sizeCharts.id, product.sizeChartId)) : Promise.resolve([]),
    ]);
    const [ancestor] = category.parentId ? await reader.select().from(categories).where(eq(categories.id, category.parentId)) : [];
    const chart = charts[0];
    return { ...card, code: product.code, description: product.description, material: product.material, fit: product.fit, care: product.care,
      category: { name: category.name, slug: category.slug, parent: ancestor ? { name: ancestor.name, slug: ancestor.slug } : null },
      images: images.map(({ id, url, alt, colorId }) => ({ id, url, alt, colorId })), colorOptions: colors.map(({ id, name, code, hex }) => ({ id, name, code, hex })),
      sizes: sortSizes(variants.filter((variant) => variant.isActive).map((variant) => variant.size)),
      variants: variants.map((variant) => ({ id: variant.id, colorId: variant.colorId, size: variant.size, sku: variant.sku, ...variantAvailability(variant.stock, variant.isActive, config.orders.lowStockThreshold, config.orders.maxQtyPerLine) })),
      sizeChart: chart ? { name: chart.name, columns: chart.columns, rows: chart.rows, note: chart.note } : null,
      seo: { title: product.seoTitle || product.name, description: product.seoDescription || product.description.slice(0, 160) } };
  }

  async function getRelatedProducts(slug: string) {
    const [product] = await reader.select().from(products).where(eq(products.slug, slug));
    if (!product) return [];
    const [category] = await reader.select().from(categories).where(eq(categories.id, product.categoryId));
    const relatedCategories = category.parentId ? await reader.select({ id: categories.id }).from(categories).where(or(eq(categories.id, category.parentId), eq(categories.parentId, category.parentId))) : [];
    const rows = await base().where(and(visible, ne(products.id, product.id), inArray(products.categoryId, [category.id, ...relatedCategories.map((entry) => entry.id)])))
      .orderBy(asc(soldOut), desc(sql`${products.categoryId} = ${category.id}`), desc(products.soldCount), asc(products.id)).limit(4);
    return cards(rows);
  }

  async function getMenu(): Promise<MenuDTO> {
    const [allCategories, visibleProducts, manual, featured] = await Promise.all([
      reader.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.id)),
      base().where(visible), reader.select({ title: collections.title, slug: collections.slug }).from(collections).where(and(eq(collections.isActive, true), eq(collections.showInMenu, true))).orderBy(asc(collections.sortOrder)),
      reader.select({ title: collections.title, slug: collections.slug, bannerUrl: collections.bannerUrl }).from(collections).where(and(eq(collections.isActive, true), eq(collections.showOnHome, true))).orderBy(asc(collections.sortOrder), asc(collections.id)).limit(1),
    ]);
    const populated = new Set(visibleProducts.map(({ product }) => product.categoryId));
    return { categories: allCategories.filter((category) => category.parentId === null).map((category) => ({ name: category.name, slug: category.slug, imageUrl: category.imageUrl,
      children: allCategories.filter((child) => child.parentId === category.id && populated.has(child.id)).map(({ name, slug }) => ({ name, slug })), populated: populated.has(category.id) }))
      .filter((category) => category.populated || category.children.length > 0).map(({ name, slug, imageUrl, children }) => ({ name, slug, imageUrl, children })), collections: manual,
      featured: featured[0] ?? null, hasSale: visibleProducts.some(({ product }) => product.compareAtPrice !== null && product.compareAtPrice > product.price) };
  }

  async function getHome(): Promise<HomeDTO> {
    const now = new Date();
    const [activeBanners, homeCollections, bestSeller, newArrival, sale, menu] = await Promise.all([
      reader.select({ id: banners.id, title: banners.title, desktopImageUrl: banners.desktopImageUrl, mobileImageUrl: banners.mobileImageUrl, alt: banners.alt, href: banners.href, ctaLabel: banners.ctaLabel })
        .from(banners).where(and(eq(banners.isActive, true), or(isNull(banners.startsAt), lte(banners.startsAt, now)), or(isNull(banners.endsAt), gte(banners.endsAt, now)))).orderBy(asc(banners.sortOrder)),
      reader.select({ title: collections.title, slug: collections.slug, bannerUrl: collections.bannerUrl }).from(collections).where(and(eq(collections.isActive, true), eq(collections.showOnHome, true))).orderBy(asc(collections.sortOrder)),
      getListing("best-seller"), getListing("new-arrival"), getListing("sale"), getMenu(),
    ]);
    return { banners: activeBanners, categories: menu.categories.slice(0, 3), bestSeller: bestSeller.products.slice(0, 8), newArrival: newArrival.products.slice(0, 8), sale: sale.products.slice(0, 4),
      collections: await Promise.all(homeCollections.map(async (collection) => ({ ...collection, products: (await getListing(collection.slug)).products.slice(0, 8) }))) };
  }
  return { getListing, search, getProductDetail, getRelatedProducts, getMenu, getHome };
}

export const getListing = cached(async (slug: string, filters: ListingFilters = emptyFilters()) => createCatalogService(getDatabase()).getListing(slug, filters), ["catalog-listing"], [CACHE_TAGS.products, CACHE_TAGS.categories, CACHE_TAGS.collections]);
export const searchProducts = cached(async (query: string, page: number = 1) => createCatalogService(getDatabase()).search(query, page), ["catalog-search"], [CACHE_TAGS.products, CACHE_TAGS.categories]);
// Metadata and page rendering share one read within a render, including cold ISR.
export const getProductDetail = cache(cached(async (slug: string) => createCatalogService(getDatabase()).getProductDetail(slug), ["catalog-product"], [CACHE_TAGS.products, CACHE_TAGS.categories, CACHE_TAGS.settings]));
export const getRelatedProducts = cached(async (slug: string) => createCatalogService(getDatabase()).getRelatedProducts(slug), ["catalog-related"], [CACHE_TAGS.products, CACHE_TAGS.categories]);
export const getMenu = cached(async () => createCatalogService(getDatabase()).getMenu(), ["catalog-menu"], [CACHE_TAGS.products, CACHE_TAGS.categories, CACHE_TAGS.collections]);
export const getHome = cached(async () => createCatalogService(getDatabase()).getHome(), ["catalog-home"], [CACHE_TAGS.products, CACHE_TAGS.categories, CACHE_TAGS.collections, CACHE_TAGS.banners]);
