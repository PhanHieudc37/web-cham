import { z } from "zod";

export const listingSortSchema = z.enum(["featured", "newest", "best", "price-asc", "price-desc", "name-asc", "name-desc"]);
export type ListingFilters = { sizes: string[]; colors: string[]; price: "under-200" | "200-400" | "over-400" | null; inStock: boolean; sort?: z.output<typeof listingSortSchema>; page: number };
export function parseListingFilters(params: Record<string, string | string[] | undefined>): ListingFilters {
  const value = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const split = (key: string) => [...new Set(value(key).split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0 && entry.length <= 30))].slice(0, 20);
  const sort = listingSortSchema.safeParse(value("sort"));
  const price = value("price");
  const page = Number(value("page"));
  return { sizes: split("size"), colors: split("color"), price: price === "under-200" || price === "200-400" || price === "over-400" ? price : null,
    inStock: value("instock") === "1", sort: sort.success ? sort.data : undefined, page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1 };
}
