"use client";

import { useId } from "react";
import type { ListingDTO } from "@/types/dto";
import type { ListingFilters } from "@/lib/validation/listing";

export function FilterFields({ facets, filters, update, clear, pending }: {
  facets: ListingDTO["facets"]; filters: ListingFilters; update: (filters: ListingFilters) => void; clear: () => void; pending: boolean;
}) {
  const id = useId();
  function toggle(values: string[], value: string) { return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]; }
  const chip = "min-h-11 min-w-11 border px-3 py-2 text-xs transition-colors hover:border-fg aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-white";
  return <fieldset disabled={pending} className="space-y-7 disabled:opacity-60">
    <legend className="sr-only">Lọc sản phẩm</legend>
    {facets.sizes.length > 0 && <fieldset><legend className="mb-3 text-xs font-semibold tracking-wider uppercase">Kích thước</legend><div className="flex flex-wrap gap-2">
      {facets.sizes.map((size) => <button type="button" key={size} className={chip} aria-pressed={filters.sizes.includes(size)} onClick={() => update({ ...filters, sizes: toggle(filters.sizes, size) })}>{size}</button>)}
    </div></fieldset>}
    {facets.colors.length > 0 && <fieldset><legend className="mb-3 text-xs font-semibold tracking-wider uppercase">Màu sắc</legend><div className="flex flex-wrap gap-2">
      {facets.colors.map((color) => <button type="button" key={color.code} className={`${chip} inline-flex items-center gap-2`} aria-pressed={filters.colors.includes(color.code)} onClick={() => update({ ...filters, colors: toggle(filters.colors, color.code) })}>
        <span className="size-4 shrink-0 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />{color.name}
      </button>)}
    </div></fieldset>}
    <fieldset><legend className="mb-3 text-xs font-semibold tracking-wider uppercase">Khoảng giá</legend><div className="space-y-1 text-xs">
      {[["", "Tất cả mức giá"], ["under-200", "Dưới 200.000₫"], ["200-400", "200.000₫ – 400.000₫"], ["over-400", "Trên 400.000₫"]].map(([value, label]) => <label key={value} className="flex min-h-10 cursor-pointer items-center gap-2">
        <input type="radio" name={`${id}-price`} value={value} checked={(filters.price ?? "") === value} onChange={() => update({ ...filters, price: value === "under-200" || value === "200-400" || value === "over-400" ? value : null })} className="size-4 accent-fg" />{label}
      </label>)}
    </div></fieldset>
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs"><input type="checkbox" className="size-4 accent-fg" checked={filters.inStock} onChange={(event) => update({ ...filters, inStock: event.target.checked })} />Chỉ hiện sản phẩm còn hàng</label>
    <button type="button" onClick={clear} className="min-h-11 text-xs underline underline-offset-4">Xóa bộ lọc</button>
  </fieldset>;
}
