"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { SearchIndexItemDTO } from "@/types/dto";

const image = z.object({ url: z.string(), alt: z.string() }).nullable();
const schema = z.array(z.object({ id: z.string(), slug: z.string(), name: z.string(), n: z.string(), price: z.number().int(), compareAtPrice: z.number().int().nullable(),
  discountPercent: z.number().nullable(), image, hoverImage: image, colors: z.array(z.object({ name: z.string(), hex: z.string() })), isNew: z.boolean(), isSoldOut: z.boolean(), soldCount: z.number().int() }));
let pending: Promise<SearchIndexItemDTO[]> | undefined;
let stored: SearchIndexItemDTO[] | null = null;
export function loadSearchIndex(): Promise<SearchIndexItemDTO[]> {
  pending ??= fetch("/search-index.json").then(async (response) => {
    if (!response.ok) throw new Error("Không tải được danh sách tìm kiếm.");
    const payload: unknown = await response.json();
    stored = schema.parse(payload);
    return stored;
  }).catch((error: unknown) => { pending = undefined; throw error; });
  return pending;
}
export function useSearchIndex(enabled = true) {
  const [items, setItems] = useState<SearchIndexItemDTO[] | null>(() => stored), [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    if (enabled) loadSearchIndex().then((items) => { if (active) { setItems(items); setError(false); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [enabled]);
  return { items, error };
}
