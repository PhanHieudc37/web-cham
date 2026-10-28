"use client";
import { useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImage } from "../common/admin-image";
import { ImageUploader } from "../common/image-uploader";
import type { ProductForm } from "./form-types";

export function ProductImages({ form, onBusyChange }: { form: ProductForm; onBusyChange: (busy: boolean) => void }) {
  const images = useWatch({ control: form.control, name: "images" }) ?? [], colors = useWatch({ control: form.control, name: "colors" }) ?? [];
  function move(index: number, to: number) { const next = [...images]; const [image] = next.splice(index, 1); next.splice(to, 0, image); form.setValue("images", next, { shouldDirty: true }); }
  return <section className="rounded-md border bg-white p-5"><div className="mb-5 flex justify-between"><h2 className="font-medium">Ảnh sản phẩm</h2><span className="text-xs text-stone-400">{images.length} / 12 ảnh</span></div>
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-3">{images.map((image, index) => <div key={image.storagePath} className="min-w-0 overflow-hidden rounded-md border"><div className="relative bg-stone-50"><AdminImage src={image.url} alt={image.alt || form.getValues("name") || "Ảnh sản phẩm"} className="aspect-square w-full" />{index < 2 && <span className="absolute top-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px]">{index === 0 ? "Ảnh chính" : "Ảnh hover"}</span>}</div>
      <div className="space-y-2 p-2"><select aria-label={`Màu ảnh ${index + 1}`} value={image.colorCode ?? ""} className="h-9 w-full rounded border bg-white px-2 text-xs" onChange={(event) => form.setValue(`images.${index}.colorCode`, event.target.value || null, { shouldDirty: true })}><option value="">Ảnh chung</option>{colors.map((color) => <option key={color.code} value={color.code}>{color.name || color.code}</option>)}</select><Input aria-label={`Mô tả ảnh ${index + 1}`} placeholder="Mô tả ảnh" className="h-9 text-xs" value={image.alt ?? ""} onChange={(event) => form.setValue(`images.${index}.alt`, event.target.value, { shouldDirty: true })} />
        <div className="flex justify-between gap-0.5"><Button type="button" variant="ghost" size="icon" aria-label={`Đưa ảnh ${index + 1} lên`} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={14} /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Đưa ảnh ${index + 1} xuống`} disabled={index === images.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={14} /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Đặt ảnh ${index + 1} làm ảnh chính`} disabled={index === 0} onClick={() => move(index, 0)}><Star size={14} /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Gỡ ảnh ${index + 1}`} onClick={() => form.setValue("images", images.filter((_, position) => position !== index), { shouldDirty: true })}><Trash2 size={14} /></Button></div>
      </div></div>)}</div>
    <ImageUploader folder="products" mode="square" remaining={12 - images.length} onBusyChange={onBusyChange} onUploaded={(image) => form.setValue("images", [...(form.getValues("images") ?? []), { url: image.url, storagePath: image.path, colorCode: null, alt: form.getValues("name") }], { shouldDirty: true })} />
    {form.formState.errors.images && <p className="mt-2 text-sm text-destructive">{form.formState.errors.images.message ?? "Kiểm tra thông tin ảnh"}</p>}
  </section>;
}
