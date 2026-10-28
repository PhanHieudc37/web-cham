"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { categoryInputSchema } from "@/lib/validation/category";
import { slugify } from "@/lib/slug";
import type { CategoryAdminDTO } from "@/types/catalog-admin";
import { saveCategoryAction, deleteCategoryAction, reorderCategoryAction, setCategoryVisibilityAction } from "@/server/actions/admin/categories";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FormField } from "../common/form-field";
import { AdminImage } from "../common/admin-image";
import { ImageUploader } from "../common/image-uploader";
import { ConfirmDialog } from "../common/confirm-dialog";
import { useHydrated } from "@/hooks/use-hydrated";

const defaults = { name: "", slug: undefined, parentId: null, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true };
export function CategoriesView({ categories }: { categories: CategoryAdminDTO[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [editing, setEditing] = useState<CategoryAdminDTO | "new" | null>(null), [deleting, setDeleting] = useState<CategoryAdminDTO | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const form = useForm<z.input<typeof categoryInputSchema>, unknown, z.output<typeof categoryInputSchema>>({ resolver: zodResolver(categoryInputSchema), defaultValues: defaults });
  const [image, setImage] = useState<string | null>(null);
  useUnsavedChanges(editing !== null && (form.formState.isDirty || busy));
  function open(person: CategoryAdminDTO | "new") { setEditing(person); setError(""); const data = person === "new" ? defaults : { ...person, imageUrl: person.imageUrl ?? "", imagePath: person.imagePath ?? "" }; form.reset(data); setImage(person === "new" ? null : person.imageUrl); }
  async function move(category: CategoryAdminDTO, direction: "up" | "down") { const result = await reorderCategoryAction({ id: category.id, direction }); if (!result.ok) toast.error(result.error.message); else router.refresh(); }
  const ordered = categories.filter((category) => !category.parentId).flatMap((root) => [root, ...categories.filter((child) => child.parentId === root.id)]);
  return <div data-catalog-ready={hydrated} className="space-y-6"><div className="flex flex-wrap justify-between gap-4"><div><p className="mb-2 text-[10px] tracking-[0.18em] text-stone-400">CỬA HÀNG / PHÂN LOẠI</p><h1 className="text-2xl font-semibold md:text-3xl">Danh mục</h1><p className="mt-2 text-sm text-stone-500">Sắp xếp sản phẩm theo từng nhóm dễ tìm.</p></div><Button className="h-11 gap-2 px-4" disabled={!hydrated} onClick={() => open("new")}><Plus size={16} />Thêm danh mục</Button></div>
    <section className="divide-y rounded-md border bg-white">{!ordered.length && <p className="p-10 text-center text-sm text-stone-500">Chưa có danh mục. Thêm danh mục đầu tiên để bắt đầu.</p>}{ordered.map((category) => <article key={category.id} className={`flex flex-wrap items-center gap-3 p-4 ${category.parentId ? "pl-7 md:pl-12" : ""}`}>
      <AdminImage src={category.imageUrl} alt={category.name} className="size-12 rounded-md bg-stone-50" /><div className="min-w-0 flex-1"><h2 className="text-sm font-medium break-words">{category.parentId && <span className="mr-2 text-stone-300">↳</span>}{category.name}</h2><p className="mt-1 text-xs break-all text-stone-400">/{category.slug} · {category.productCount} sản phẩm</p></div>
      <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto"><label className="mr-auto flex min-h-11 items-center gap-2 text-xs sm:mr-3"><input key={`${category.id}-${category.isActive}`} type="checkbox" defaultChecked={category.isActive} aria-label={`Hiển thị ${category.name}`} onChange={async (event) => { const element = event.currentTarget; element.disabled = true; const result = await setCategoryVisibilityAction({ id: category.id, active: element.checked }); if (!result.ok) { element.checked = category.isActive; element.disabled = false; toast.error(result.error.message); } else router.refresh(); }} />Hiển thị</label>
        <Button variant="ghost" size="icon" className="size-10" aria-label={`Đưa ${category.name} lên`} onClick={() => void move(category, "up")}><ArrowUp size={15} /></Button><Button variant="ghost" size="icon" className="size-10" aria-label={`Đưa ${category.name} xuống`} onClick={() => void move(category, "down")}><ArrowDown size={15} /></Button><Button variant="ghost" size="icon" className="size-10" aria-label={`Sửa ${category.name}`} onClick={() => open(category)}><Pencil size={15} /></Button><Button variant="ghost" size="icon" className="size-10" aria-label={`Xóa ${category.name}`} onClick={() => setDeleting(category)}><Trash2 size={15} /></Button>
      </div></article>)}</section>
    <Dialog open={editing !== null} onOpenChange={(value) => { if (busy || form.formState.isSubmitting) return; if (!value && form.formState.isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn muốn đóng?")) return; setEditing(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-md"><DialogHeader><DialogTitle>{editing === "new" ? "Thêm danh mục" : "Sửa danh mục"}</DialogTitle><DialogDescription>Danh mục được sắp tối đa hai cấp.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => { if (busy) return; setError(""); const result = await saveCategoryAction({ ...values, slug: editing === "new" && !form.formState.dirtyFields.slug ? undefined : values.slug || undefined }); if (!result.ok) { setError(result.error.message); for (const key of ["name", "slug", "parentId"] as const) if (result.error.fields?.[key]) form.setError(key, { message: result.error.fields[key] }); return; } toast.success("Đã lưu"); form.reset(); setEditing(null); router.refresh(); })}>
        <FormField id="category-name" label="Tên danh mục" {...form.register("name", { onChange: (event: React.ChangeEvent<HTMLInputElement>) => { if (!form.formState.dirtyFields.slug) form.setValue("slug", slugify(event.target.value)); } })} error={form.formState.errors.name?.message} />
        <FormField id="category-slug" label="Đường dẫn" {...form.register("slug", { setValueAs: (value: string) => value || undefined })} error={form.formState.errors.slug?.message} />
        <div className="space-y-2"><Label htmlFor="parent-category">Danh mục cha</Label><select id="parent-category" className="h-11 w-full rounded-md border bg-white px-3 text-sm" {...form.register("parentId", { setValueAs: (value: string) => value || null })}><option value="">Không có (danh mục cấp một)</option>{categories.filter((category) => !category.parentId && (editing === "new" || category.id !== editing?.id)).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{form.formState.errors.parentId && <p className="text-sm text-destructive">{form.formState.errors.parentId.message}</p>}</div>
        {image && <div className="flex items-center gap-3"><AdminImage src={image} alt="Ảnh danh mục" className="size-20 rounded-md" /><Button variant="outline" className="h-9 px-3" type="button" onClick={() => { form.setValue("imageUrl", "", { shouldDirty: true }); form.setValue("imagePath", "", { shouldDirty: true }); setImage(null); }}>Gỡ ảnh</Button></div>}
        <ImageUploader folder="categories" mode="fit" onBusyChange={setBusy} onUploaded={(uploaded) => { form.setValue("imageUrl", uploaded.url, { shouldDirty: true }); form.setValue("imagePath", uploaded.path, { shouldDirty: true }); setImage(uploaded.url); }} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isActive")} />Hiển thị trên cửa hàng</label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="sticky bottom-0 h-11 w-full" disabled={busy || form.formState.isSubmitting}>Lưu danh mục</Button>
      </form></DialogContent></Dialog>
    <ConfirmDialog open={Boolean(deleting)} title="Xóa danh mục?" description={`Danh mục ${deleting?.name ?? ""} chỉ xóa được khi không còn sản phẩm và danh mục con.`} onClose={() => setDeleting(null)} onConfirm={async () => { const result = await deleteCategoryAction({ id: deleting?.id }); if (result.ok) router.refresh(); return result; }} />
  </div>;
}
