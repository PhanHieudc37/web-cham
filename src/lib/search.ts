import { normalizeVietnamese } from "./normalize";
import { PAGE_SIZE } from "./constants";
import type { SearchIndexItemDTO } from "@/types/dto";

function trigrams(text: string) {
  const result = new Set<string>();
  for (const word of text.match(/[a-z0-9]+/g) ?? []) {
    const padded = `  ${word} `;
    for (let index = 0; index < padded.length - 2; index++) result.add(padded.slice(index, index + 3));
  }
  return result;
}
const cachedTrigrams = new WeakMap<SearchIndexItemDTO, Set<string>>();
export function searchIndex(items: SearchIndexItemDTO[], query: string, requestedPage = 1) {
  const normalized = normalizeVietnamese(query).slice(0, 200), words = normalized.split(" "), queryTrigrams = trigrams(normalized);
  const score = (item: SearchIndexItemDTO) => {
    let itemTrigrams = cachedTrigrams.get(item);
    if (!itemTrigrams) { itemTrigrams = trigrams(item.n); cachedTrigrams.set(item, itemTrigrams); }
    const shared = [...queryTrigrams].filter((value) => itemTrigrams.has(value)).length;
    return shared / Math.max(1, itemTrigrams.size + queryTrigrams.size - shared);
  };
  const found = normalized.length < 2 ? [] : items.filter((item) => words.every((word) => item.n.includes(word))).map((item) => ({ item, score: score(item) }))
    .sort((a, b) => Number(a.item.isSoldOut) - Number(b.item.isSoldOut) || b.score - a.score || b.item.soldCount - a.item.soldCount || a.item.id.localeCompare(b.item.id)).map(({ item }) => item);
  const totalPages = Math.max(1, Math.ceil(found.length / PAGE_SIZE)), page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage) || 1));
  return { products: found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: found.length, totalPages, page };
}
