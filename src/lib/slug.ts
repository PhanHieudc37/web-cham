import { normalizeVietnamese } from "./normalize";

export function slugify(value: string): string {
  return normalizeVietnamese(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(name: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugify(name) || "san-pham";
  let suffix = 1;
  while (await exists(suffix === 1 ? base : `${base}-${suffix}`)) suffix += 1;
  return suffix === 1 ? base : `${base}-${suffix}`;
}
