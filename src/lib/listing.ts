import { PAGE_SIZE } from "./constants";
import type { ListingDTO, ListingItemDTO } from "@/types/dto";
import type { ListingFilters } from "./validation/listing";

const compareText = (left: string, right: string) => left.localeCompare(right, "en");
function compareDiscount(left: ListingItemDTO, right: ListingItemDTO) {
  if (left.compareAtPrice === null) return right.compareAtPrice === null ? 0 : 1;
  if (right.compareAtPrice === null) return -1;
  // Compare exact ratios without floating-point rounding or unsafe VND multiplication.
  const delta = BigInt(left.price) * BigInt(right.compareAtPrice) - BigInt(right.price) * BigInt(left.compareAtPrice);
  return delta < BigInt(0) ? -1 : delta > BigInt(0) ? 1 : 0;
}
export function filterListing(items: ListingItemDTO[], filters: ListingFilters, facets: ListingDTO["facets"], defaultSort: string) {
  const effective = { ...filters, sizes: filters.sizes.filter((size) => facets.sizes.includes(size)), colors: filters.colors.flatMap((color) => {
    const option = facets.colors.find((option) => option.code.toLowerCase() === color.toLowerCase());
    return option ? [option.code] : [];
  }) };
  const sort = effective.sort ?? defaultSort;
  const filtered = items.filter((item) => {
    if ((effective.sizes.length || effective.colors.length) && !item.options.some((option) =>
      (!effective.sizes.length || effective.sizes.includes(option.size)) && (!effective.colors.length || effective.colors.some((code) => code.toLowerCase() === option.colorCode.toLowerCase())))) return false;
    return !(effective.price === "under-200" && item.price >= 200000 || effective.price === "200-400" && (item.price < 200000 || item.price > 400000)
      || effective.price === "over-400" && item.price <= 400000 || effective.inStock && item.isSoldOut);
  }).sort((left, right) => {
    let delta = Number(left.isSoldOut) - Number(right.isSoldOut);
    if (delta) return delta;
    if (sort === "price-asc") delta = left.price - right.price;
    else if (sort === "price-desc") delta = right.price - left.price;
    else if (sort === "name-asc") delta = compareText(left.slug, right.slug);
    else if (sort === "name-desc") delta = compareText(right.slug, left.slug);
    else if (sort === "newest") delta = (right.publishedAt ? Date.parse(right.publishedAt) : -Infinity) - (left.publishedAt ? Date.parse(left.publishedAt) : -Infinity);
    else if (sort === "best") delta = Number(right.isBestSeller) - Number(left.isBestSeller) || right.soldCount - left.soldCount;
    else if (sort === "sale") delta = compareDiscount(left, right);
    else delta = (left.manualSortOrder ?? Infinity) - (right.manualSortOrder ?? Infinity) || left.sortOrder - right.sortOrder
      || (right.publishedAt ? Date.parse(right.publishedAt) : -Infinity) - (left.publishedAt ? Date.parse(left.publishedAt) : -Infinity);
    return delta || compareText(left.id, right.id);
  });
  const total = filtered.length, totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE)), page = Math.min(effective.page, totalPages);
  return { products: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, totalPages, page, filters: { ...effective, page } };
}
