import type { ListingFilters } from "./validation/listing";

export function listingQuery(filters: ListingFilters): string {
  const query = new URLSearchParams();
  if (filters.sizes.length) query.set("size", filters.sizes.join(","));
  if (filters.colors.length) query.set("color", filters.colors.join(","));
  if (filters.price) query.set("price", filters.price);
  if (filters.inStock) query.set("instock", "1");
  if (filters.sort) query.set("sort", filters.sort);
  if (filters.page > 1) query.set("page", String(filters.page));
  return query.toString();
}
