"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useFieldArray, useWatch } from "react-hook-form";
import { SIZE_ORDER } from "@/lib/domain/sizes";
import { createSku } from "@/lib/domain/variants";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductForm } from "./form-types";

export function VariantEditor({ form }: { form: ProductForm }) {
  const colors = useWatch({ control: form.control, name: "colors" }) ?? [];
  const variants = useWatch({ control: form.control, name: "variants" }) ?? [];
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "colors", keyName: "fieldKey" });
  const [selectedSizes, setSelectedSizes] = useState(() => [...new Set((form.getValues("variants") ?? []).map((variant) => variant.size))]);
  const [customSize, setCustomSize] = useState(""), [allStock, setAllStock] = useState(0), [showSku, setShowSku] = useState(false);
  const remembered = useRef(form.getValues("variants") ?? []);
  function rebuild(nextSizes: string[], nextColors = form.getValues("colors") ?? []) {
    const current = form.getValues("variants") ?? [];
    remembered.current = [...remembered.current.filter((old) => !current.some((entry) => entry.colorCode === old.colorCode && entry.size === old.size)), ...current];
    form.setValue("variants", nextColors.flatMap((color) => nextSizes.map((size) => remembered.current.find((variant) => variant.colorCode === color.code && variant.size === size) ?? {
      colorCode: color.code, size, sku: createSku(form.getValues("code"), color.code, size), stock: 0, isActive: true,
    })), { shouldDirty: true });
    setSelectedSizes(nextSizes);
  }
  function colorName(index: number, name: string) {
    const current = colors[index]; form.setValue(`colors.${index}.name`, name, { shouldDirty: true });
    if (!current.id) {
      const next = slugify(name) || `mau-${index + 1}`;
      form.setValue(`colors.${index}.code`, next, { shouldDirty: true });
      form.setValue("variants", (form.getValues("variants") ?? []).map((variant) => variant.colorCode === current.code ? { ...variant, colorCode: next, sku: createSku(form.getValues("code"), next, variant.size) } : variant), { shouldDirty: true });
      form.setValue("images", (form.getValues("images") ?? []).map((image) => image.colorCode === current.code ? { ...image, colorCode: next } : image), { shouldDirty: true });
    }
  }
  const cell = (index: number) => {
    const variant = variants[index]; if (!variant) return null;
    const color = colors.find((entry) => entry.code === variant.colorCode);
    return <div className="space-y-2"><Input type="number" min={0} max={1000000} className="h-10 min-w-16 bg-white" aria-label={`Tồn kho ${color?.name ?? variant.colorCode} ${variant.size}`} value={variant.stock} onChange={(event) => form.setValue(`variants.${index}.stock`, Number(event.target.value), { shouldDirty: true })} />
      <label className="flex min-h-8 items-center gap-2 text-[11px] text-stone-500"><input type="checkbox" checked={variant.isActive} aria-label={`Đang bán ${color?.name ?? variant.colorCode} ${variant.size}`} onChange={(event) => form.setValue(`variants.${index}.isActive`, event.target.checked, { shouldDirty: true })} />Đang bán</label>
      {showSku && <Input className="h-9 bg-white text-xs" aria-label={`SKU ${color?.name ?? variant.colorCode} ${variant.size}`} value={variant.sku} onChange={(event) => form.setValue(`variants.${index}.sku`, event.target.value.toUpperCase(), { shouldDirty: true })} />}
      {form.formState.errors.variants?.[index]?.stock?.message && <p className="text-xs text-destructive">{form.formState.errors.variants[index]?.stock?.message}</p>}
      {showSku && form.formState.errors.variants?.[index]?.sku?.message && <p className="text-xs text-destructive">{form.formState.errors.variants[index]?.sku?.message}</p>}
    </div>;
  };
  return <div className="space-y-6">
    <section className="rounded-md border bg-white p-5"><h2 className="mb-5 font-medium">Màu sắc</h2><div className="space-y-3">{fields.map((field, index) => <div key={field.fieldKey} className="flex flex-wrap items-center gap-2 rounded-md border p-3">
      <input type="color" aria-label={`Chọn mã màu ${index + 1}`} value={colors[index]?.hex ?? "#111111"} onChange={(event) => form.setValue(`colors.${index}.hex`, event.target.value, { shouldDirty: true })} className="size-9 shrink-0 cursor-pointer border-0 bg-transparent" />
      <Input aria-label={`Tên màu ${index + 1}`} placeholder="Tên màu" className="h-10 min-w-24 flex-1" value={colors[index]?.name ?? ""} onChange={(event) => colorName(index, event.target.value)} />
      <Input aria-label={`Mã hex ${index + 1}`} className="h-10 w-24" {...form.register(`colors.${index}.hex`)} /><span className="min-w-0 text-xs break-all text-stone-400">{colors[index]?.code}</span>
      <div className="ml-auto flex"><Button type="button" variant="ghost" size="icon" aria-label={`Đưa màu ${index + 1} lên`} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={14} /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Đưa màu ${index + 1} xuống`} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={14} /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Xóa màu ${index + 1}`} onClick={() => { const code = colors[index].code; remove(index); form.setValue("variants", variants.filter((variant) => variant.colorCode !== code), { shouldDirty: true }); form.setValue("images", (form.getValues("images") ?? []).map((image) => image.colorCode === code ? { ...image, colorCode: null } : image), { shouldDirty: true }); }}><Trash2 size={14} /></Button></div>
    </div>)}</div><Button type="button" variant="outline" className="mt-4 h-10 gap-2 px-3" onClick={() => { const next = { name: "", code: `mau-${crypto.randomUUID().slice(0, 8)}`, hex: "#111111" }; append(next); rebuild(selectedSizes, [...colors, next]); }}><Plus size={14} />Thêm màu</Button>
      {form.formState.errors.colors && <p className="mt-2 text-sm text-destructive">{form.formState.errors.colors.message ?? form.formState.errors.colors.root?.message ?? "Kiểm tra tên và mã màu"}</p>}
    </section>
    <section className="rounded-md border bg-white p-5"><h2 className="mb-4 font-medium">Kích thước</h2><div className="flex flex-wrap gap-2">{[...new Set([...SIZE_ORDER, ...selectedSizes])].map((size) => <Button type="button" key={size} variant={selectedSizes.includes(size) ? "default" : "outline"} className="h-10 px-3 text-xs" aria-pressed={selectedSizes.includes(size)} onClick={() => rebuild(selectedSizes.includes(size) ? selectedSizes.filter((entry) => entry !== size) : [...selectedSizes, size])}>{size}</Button>)}</div>
      <div className="mt-4 flex gap-2"><Input aria-label="Size tùy chỉnh" value={customSize} maxLength={20} placeholder="Thêm size khác" className="h-10" onChange={(event) => setCustomSize(event.target.value)} /><Button type="button" variant="outline" className="h-10 px-3" onClick={() => { const size = customSize.trim(); if (size && !selectedSizes.includes(size)) rebuild([...selectedSizes, size]); setCustomSize(""); }}>Thêm size</Button></div></section>
    <section className="min-w-0 rounded-md border bg-white p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-medium">Biến thể & tồn kho <span className="ml-2 text-xs font-normal text-stone-400">{variants.length} biến thể</span></h2><Button type="button" variant="ghost" className="h-9 px-2 text-xs" onClick={() => setShowSku(!showSku)}>{showSku ? "Ẩn SKU" : "Hiện SKU"}</Button></div>
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-md bg-stone-50 p-3"><label htmlFor="all-stock" className="text-xs text-stone-500">Đặt tồn kho cho tất cả</label><Input id="all-stock" type="number" min={0} max={1000000} value={allStock} onChange={(event) => setAllStock(Number(event.target.value))} className="h-9 w-24 bg-white" /><Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => form.setValue("variants", variants.map((variant) => ({ ...variant, stock: allStock })), { shouldDirty: true })}>Áp dụng</Button></div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead><tr><th className="p-2 text-left font-medium">Màu / Size</th>{selectedSizes.map((size) => <th key={size} className="min-w-28 p-2 text-left font-medium">{size}</th>)}</tr></thead><tbody>{colors.map((color) => <tr key={color.code} className="border-t"><th className="p-2 text-left text-xs font-medium">{color.name || color.code}</th>{selectedSizes.map((size) => <td key={size} className="p-2 align-top">{cell(variants.findIndex((variant) => variant.colorCode === color.code && variant.size === size))}</td>)}</tr>)}</tbody></table></div>
      <div className="space-y-5 md:hidden">{colors.map((color) => <div key={color.code}><h3 className="mb-3 flex items-center gap-2 text-sm font-medium"><span className="size-3 rounded-full border" style={{ backgroundColor: color.hex }} />{color.name || color.code}</h3><div className="grid grid-cols-2 gap-3">{selectedSizes.map((size) => <div key={size} className="rounded-md border bg-stone-50 p-3"><p className="mb-2 text-xs font-medium">Size {size}</p>{cell(variants.findIndex((variant) => variant.colorCode === color.code && variant.size === size))}</div>)}</div></div>)}</div>
      <p className="mt-4 text-xs leading-5 text-stone-500">Biến thể bị gỡ sẽ ngừng bán và được giữ lại để đối chiếu đơn cũ. Điều chỉnh tồn kho luôn giữ các lượt bán phát sinh khi bạn đang mở form.</p><Input placeholder="Ghi chú điều chỉnh" aria-label="Ghi chú điều chỉnh" className="mt-3 h-10" maxLength={500} {...form.register("stockNote")} />{form.formState.errors.stockNote && <p className="text-sm text-destructive">{form.formState.errors.stockNote.message}</p>}
      {form.formState.errors.variants && <p className="mt-3 text-sm text-destructive">{form.formState.errors.variants.message ?? form.formState.errors.variants.root?.message ?? "Kiểm tra số lượng tồn kho và SKU của các biến thể"}</p>}
    </section>
  </div>;
}
