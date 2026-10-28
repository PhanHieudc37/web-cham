"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { collectionInputSchema } from "@/lib/validation/collection";
import { slugify } from "@/lib/slug";
import type { CollectionAdminDTO, CollectionInput, ProductChoiceDTO } from "@/types/content-admin";
import { saveCollectionAction } from "@/server/actions/admin/content";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField } from "../common/form-field";
import { MediaField } from "../common/media-field";
import { ProductPicker } from "./product-picker";
import { AdminImage } from "../common/admin-image";

const defaults: CollectionInput = { title: "", slug: undefined, description: "", bannerUrl: "", bannerPath: "", isActive: true, showOnHome: false, showInMenu: false, sortOrder: 0, productIds: [] };
export function CollectionEditor({ collection, initialProducts = [] }: { collection?: CollectionAdminDTO; initialProducts?: ProductChoiceDTO[] }) {
  const router = useRouter(), hydrated = useHydrated();
  const form = useForm<z.input<typeof collectionInputSchema>, unknown, CollectionInput>({ resolver: zodResolver(collectionInputSchema), defaultValues: collection ?? defaults });
  const watched = useWatch({ control: form.control });
  const [busy, setBusy] = useState(false), [picker, setPicker] = useState(false), [products, setProducts] = useState(initialProducts), [error, setError] = useState("");
  useUnsavedChanges(form.formState.isDirty || busy);
  function move(index: number, to: number) { const ids = [...(form.getValues("productIds") ?? [])]; const [id] = ids.splice(index, 1); ids.splice(to, 0, id); form.setValue("productIds", ids, { shouldDirty: true }); }
  return <div data-content-ready={hydrated} className="space-y-6 pb-20 md:pb-0"><Link href="/admin/collections" className="text-xs text-stone-500">← Bộ sưu tập</Link><h1 className="text-2xl font-semibold md:text-3xl">{collection ? "Chỉnh sửa bộ sưu tập" : "Thêm bộ sưu tập"}</h1><form onSubmit={form.handleSubmit(async (values) => {
    if (busy) return; setError(""); const result = await saveCollectionAction({ ...values, slug: !collection && !form.formState.dirtyFields.slug ? undefined : values.slug });
    if (!result.ok) { setError(result.error.message); if (result.error.fields?.slug) form.setError("slug", { message: result.error.fields.slug }); return; }
    toast.success("Đã lưu"); form.reset(result.data.collection ?? { ...values, id: result.data.id }); router.push(`/admin/collections/${result.data.id}`); router.refresh();
  }, () => setError("Vui lòng kiểm tra các ô thông tin."))}><fieldset className="contents" disabled={!hydrated}>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="space-y-6"><section className="space-y-4 rounded-md border bg-white p-5"><h2 className="font-medium">Thông tin bộ sưu tập</h2><FormField id="collection-title" label="Tên bộ sưu tập" {...form.register("title", { onChange: (event: React.ChangeEvent<HTMLInputElement>) => { if (!collection && !form.formState.dirtyFields.slug) form.setValue("slug", slugify(event.target.value)); } })} error={form.formState.errors.title?.message} /><FormField id="collection-slug" label="Đường dẫn" {...form.register("slug", { setValueAs: (value: string) => value || undefined })} error={form.formState.errors.slug?.message} /><div className="space-y-2"><Label htmlFor="collection-description">Mô tả</Label><Textarea id="collection-description" rows={4} {...form.register("description")} />{form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}</div><MediaField label="Ảnh bộ sưu tập" url={watched.bannerUrl ?? null} onBusyChange={setBusy} onChange={(image) => { form.setValue("bannerUrl", image?.url ?? "", { shouldDirty: true }); form.setValue("bannerPath", image?.path ?? "", { shouldDirty: true }); }} /></section>
      <section className="rounded-md border bg-white p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-medium">Sản phẩm <span className="text-xs text-stone-400">{watched.productIds?.length ?? 0}</span></h2><Button variant="outline" type="button" className="h-10 gap-2 px-3 text-xs" onClick={() => setPicker(true)}><Plus size={14} />Thêm sản phẩm</Button></div><div className="space-y-2">{watched.productIds?.map((id, index) => { const product = products.find((item) => item.id === id); return <div key={id} className="flex flex-wrap items-center gap-3 rounded-md border p-3"><AdminImage src={product?.imageUrl ?? null} alt="" className="size-10" /><div className="min-w-0 flex-1"><p className="text-sm break-words">{product?.name ?? "Sản phẩm không còn tồn tại"}</p><p className="text-xs text-stone-400">{product?.code}</p></div><div className="ml-auto flex"><Button type="button" variant="ghost" size="icon" aria-label={`Đưa sản phẩm ${index + 1} lên`} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={14} /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Đưa sản phẩm ${index + 1} xuống`} disabled={index === (watched.productIds?.length ?? 0) - 1} onClick={() => move(index, index + 1)}><ArrowDown size={14} /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Gỡ sản phẩm ${index + 1}`} onClick={() => form.setValue("productIds", (form.getValues("productIds") ?? []).filter((item) => item !== id), { shouldDirty: true })}><Trash2 size={14} /></Button></div></div>; })}{!watched.productIds?.length && <p className="py-6 text-center text-sm text-stone-400">Chọn sản phẩm để thêm vào bộ sưu tập.</p>}</div>{form.formState.errors.productIds && <p className="mt-2 text-sm text-destructive">{form.formState.errors.productIds.message}</p>}</section>
    </div><aside className="space-y-4 rounded-md border bg-white p-5"><h2 className="font-medium">Hiển thị</h2>{([['isActive','Hiển thị bộ sưu tập'],['showOnHome','Hiện trên trang chủ'],['showInMenu','Hiện trên menu']] as const).map(([key,label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register(key)} />{label}</label>)}<FormField id="collection-order" label="Thứ tự" type="number" min={0} {...form.register("sortOrder", { valueAsNumber: true })} error={form.formState.errors.sortOrder?.message} /></aside></div>
      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}<div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t bg-white p-3 md:static md:mt-6 md:rounded-md md:border"><span className="text-xs text-stone-500">{form.formState.isDirty ? "Có thay đổi chưa lưu" : "Bộ sưu tập"}</span><Button type="submit" className="h-11 px-4" disabled={busy || form.formState.isSubmitting}>Lưu bộ sưu tập</Button></div>
  </fieldset></form><ProductPicker open={picker} selected={watched.productIds ?? []} onClose={() => setPicker(false)} onAdd={(selected) => { setProducts([...products, ...selected]); form.setValue("productIds", [...new Set([...(form.getValues("productIds") ?? []), ...selected.map((product) => product.id)])], { shouldDirty: true }); }} /></div>;
}
