"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { createSku } from "@/lib/domain/variants";
import { discountPercent } from "@/lib/domain/pricing";
import { productInputSchema, type ProductInput } from "@/lib/validation/product";
import type { ProductEditorDTO, ProductOptionsDTO, StockMovementDTO } from "@/types/catalog-admin";
import { saveProductAction } from "@/server/actions/admin/products";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormField } from "../common/form-field";
import { ProductImages } from "./product-images";
import { VariantEditor } from "./variant-editor";
import { SizeChartDialog } from "./size-chart-dialog";

const initialValues: ProductInput = { code: "", name: "", slug: undefined, categoryId: "", status: "draft", price: 0, compareAtPrice: null, description: "", material: "", fit: "", care: [], sizeChartId: null,
  isNew: false, isBestSeller: false, sortOrder: 0, seoTitle: "", seoDescription: "", collectionIds: [], stockNote: "", colors: [{ name: "Đen", code: "den", hex: "#111111" }],
  variants: ["S", "M", "L", "XL"].map((size) => ({ colorCode: "den", size, sku: `DEN-${size}`, stock: 0, isActive: true })), images: [] };
const reasons: Record<string, string> = { order: "Đơn hàng", cancel: "Hủy đơn", return: "Hoàn trả", manual: "Điều chỉnh", import: "Nhập hàng" };
export function ProductEditor({ product, options, history, initialTab = "details" }: { product?: ProductEditorDTO; options: ProductOptionsDTO; history?: { movements: StockMovementDTO[]; page: number; totalPages: number }; initialTab?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const form = useForm<z.input<typeof productInputSchema>, unknown, ProductInput>({ resolver: zodResolver(productInputSchema), defaultValues: product?.values ?? initialValues });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [chartOpen, setChartOpen] = useState(false), [charts, setCharts] = useState(options.sizeCharts), [tab, setTab] = useState(initialTab);
  const watched = useWatch({ control: form.control });
  const price = watched.price ?? 0, comparePrice = watched.compareAtPrice ?? null, name = watched.name ?? "", slug = watched.slug, collections = watched.collectionIds ?? [];
  const sale = discountPercent(price, comparePrice);
  useUnsavedChanges(form.formState.isDirty || busy);
  const fieldError = (key: keyof ProductInput) => form.formState.errors[key]?.message;
  return <div data-catalog-ready={hydrated} className="min-w-0 space-y-6 pb-20 md:pb-0"><Link href="/admin/products" className="flex w-fit items-center gap-2 text-xs text-stone-500"><ArrowLeft size={14} />Danh sách sản phẩm</Link>
    <div><p className="mb-2 text-[10px] tracking-[0.18em] text-stone-400">CỬA HÀNG / SẢN PHẨM</p><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}</h1><p className="mt-2 text-sm text-stone-500">Chăm chút thông tin, hình ảnh và từng biến thể.</p></div>
    <Tabs value={tab} onValueChange={setTab}><TabsList className="mb-5"><TabsTrigger value="details">Thông tin sản phẩm</TabsTrigger>{product && <TabsTrigger value="stock">Lịch sử tồn kho</TabsTrigger>}</TabsList>
      <TabsContent value="details"><form onSubmit={form.handleSubmit(async (values) => {
        if (busy) return; setError(""); const result = await saveProductAction({ ...values, slug: !product && !form.formState.dirtyFields.slug ? undefined : values.slug || undefined });
        if (!result.ok) { setError(result.error.message); for (const key of ["code", "slug", "categoryId", "colors", "variants", "images", "status"] as const) if (result.error.fields?.[key]) form.setError(key, { message: result.error.fields[key] }); return; }
        toast.success("Đã lưu"); form.reset(result.data.product.values); router.push(`/admin/products/${result.data.id}`); router.refresh();
      }, () => { setError("Vui lòng kiểm tra các ô thông tin bên dưới."); })}>
        <fieldset disabled={!hydrated} className="contents">{error && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-destructive">{error}</p>}
        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0 space-y-6">
          <section className="space-y-5 rounded-md border bg-white p-5"><h2 className="font-medium">Thông tin cơ bản</h2><FormField id="product-name" label="Tên sản phẩm *" {...form.register("name", { onChange: (event: React.ChangeEvent<HTMLInputElement>) => { if (!product && !form.formState.dirtyFields.slug) form.setValue("slug", slugify(event.target.value)); } })} error={fieldError("name")} />
            <FormField id="product-code" label="Mã sản phẩm *" {...form.register("code", { onChange: (event: React.ChangeEvent<HTMLInputElement>) => { const previous = form.getValues("code"); const code = event.target.value.toUpperCase(); form.setValue("code", code, { shouldDirty: true }); form.setValue("variants", (form.getValues("variants") ?? []).map((variant) => !variant.id || variant.sku === createSku(previous, variant.colorCode, variant.size) ? { ...variant, sku: createSku(code, variant.colorCode, variant.size) } : variant), { shouldDirty: true }); } })} error={fieldError("code")} />
            <FormField id="product-slug" label="Đường dẫn" {...form.register("slug", { setValueAs: (value: string) => value || undefined })} error={fieldError("slug")} />{product?.publishedAt && slug !== product.values.slug && <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">Link cũ sẽ không còn truy cập được sau khi đổi đường dẫn.</p>}
          </section>
          <section className="space-y-4 rounded-md border bg-white p-5"><div className="flex justify-between"><h2 className="font-medium">Giá bán</h2>{sale !== null && <span className="text-xs text-destructive">Giảm {sale}%</span>}</div><div className="grid gap-4 sm:grid-cols-2"><FormField id="product-price" label="Giá bán * (VND)" inputMode="numeric" value={price ? new Intl.NumberFormat("vi-VN").format(price) : ""} onChange={(event) => form.setValue("price", Number(event.target.value.replace(/\D/g, "")), { shouldDirty: true })} error={fieldError("price")} /><FormField id="product-compare-price" label="Giá gốc (VND)" inputMode="numeric" value={comparePrice ? new Intl.NumberFormat("vi-VN").format(comparePrice) : ""} onChange={(event) => form.setValue("compareAtPrice", event.target.value.replace(/\D/g, "") ? Number(event.target.value.replace(/\D/g, "")) : null, { shouldDirty: true })} error={fieldError("compareAtPrice")} /></div></section>
          <section className="space-y-4 rounded-md border bg-white p-5"><h2 className="font-medium">Mô tả & chất liệu</h2><div className="space-y-2"><Label htmlFor="description">Mô tả sản phẩm</Label><Textarea id="description" rows={5} maxLength={20000} {...form.register("description")} />{fieldError("description") && <p className="text-sm text-destructive">{fieldError("description")}</p>}</div><div className="grid gap-4 sm:grid-cols-2"><FormField id="material" label="Chất liệu" {...form.register("material")} error={fieldError("material")} /><FormField id="fit" label="Form dáng" {...form.register("fit")} error={fieldError("fit")} /></div><div className="space-y-2"><Label htmlFor="care">Hướng dẫn bảo quản (mỗi dòng một hướng dẫn)</Label><Textarea id="care" rows={3} value={(watched.care ?? []).join("\n")} onChange={(event) => form.setValue("care", event.target.value.split("\n"), { shouldDirty: true })} />{form.formState.errors.care && <p className="text-sm text-destructive">{fieldError("care") || "M?i h??ng d?n t?i ?a 300 k? t?, t?i ?a 20 d?ng"}</p>}</div>
            <div className="space-y-2"><Label htmlFor="size-chart">Bảng size</Label><select id="size-chart" className="h-11 w-full rounded-md border bg-white px-3 text-sm" {...form.register("sizeChartId", { setValueAs: (value: string) => value || null })}><option value="">Không chọn</option>{charts.map((chart) => <option key={chart.id} value={chart.id}>{chart.name}</option>)}</select><Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => setChartOpen(true)}>Tạo bảng size mới</Button></div>
          </section>
          <ProductImages form={form} onBusyChange={setBusy} /><VariantEditor form={form} />
          <details className="rounded-md border bg-white p-5"><summary className="cursor-pointer text-sm font-medium">SEO & xem trước tìm kiếm</summary><div className="mt-5 space-y-4"><FormField id="seo-title" label="Tiêu đề SEO" {...form.register("seoTitle")} error={fieldError("seoTitle")} /><FormField id="seo-description" label="Mô tả SEO" {...form.register("seoDescription")} error={fieldError("seoDescription")} /><div className="rounded-md bg-stone-50 p-4"><p className="text-sm text-blue-700">{watched.seoTitle || name || "Tên sản phẩm"} | Cham.stu</p><p className="mt-1 text-xs break-all text-emerald-800">/products/{slug || "duong-dan"}</p><p className="mt-2 text-xs text-stone-500">{watched.seoDescription || "Thêm mô tả ngắn để giới thiệu sản phẩm."}</p></div></div></details>
        </div>
        <aside className="space-y-5 xl:sticky xl:top-24"><section className="space-y-5 rounded-md border bg-white p-5"><h2 className="font-medium">Trạng thái & phân loại</h2><div className="space-y-2"><Label htmlFor="product-status">Trạng thái</Label><select id="product-status" className="h-11 w-full rounded-md border bg-white px-3 text-sm" {...form.register("status")}>{Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{fieldError("status") && <p className="text-sm text-destructive">{fieldError("status")}</p>}</div>
          <div className="space-y-2"><Label htmlFor="product-category">Danh mục *</Label><select id="product-category" className="h-11 w-full rounded-md border bg-white px-3 text-sm" {...form.register("categoryId")}><option value="">Chọn danh mục</option>{options.categories.map((category) => <option key={category.id} value={category.id}>{category.parentId ? "↳ " : ""}{category.name}{!category.isActive ? " (đang ẩn)" : ""}</option>)}</select>{fieldError("categoryId") && <p className="text-sm text-destructive">Vui lòng chọn danh mục</p>}</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isNew")} />Nhãn NEW</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isBestSeller")} />Ghim BEST SELLER</label><FormField id="sort-order" type="number" min={0} label="Thứ tự nổi bật" {...form.register("sortOrder", { valueAsNumber: true })} error={fieldError("sortOrder")} />
          {options.collections.length > 0 && <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Bộ sưu tập</legend>{options.collections.map((collection) => <label key={collection.id} className="flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={collections.includes(collection.id)} onChange={(event) => form.setValue("collectionIds", event.target.checked ? [...collections, collection.id] : collections.filter((id) => id !== collection.id), { shouldDirty: true })} />{collection.title}</label>)}</fieldset>}
        </section><div className="rounded-md border bg-stone-100 p-4 text-xs leading-6 text-stone-500"><span className="flex items-center gap-2 font-medium text-stone-800"><Check size={14} />Sẵn sàng trước khi bán</span>Có ảnh, chọn danh mục và bật ít nhất một biến thể đang bán.</div></aside></div>
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-white p-3 md:static md:mt-6 md:rounded-md md:border md:p-4 lg:ml-60 md:lg:ml-0"><span className="pl-1 text-xs text-stone-500">{form.formState.isDirty ? "Có thay đổi chưa lưu" : "Thông tin sản phẩm"}<span className="ml-2 hidden sm:inline">{price > 0 && formatPrice(price)}</span></span><Button type="submit" className="h-11 gap-2 px-4" disabled={busy || form.formState.isSubmitting}><Save size={16} />{form.formState.isSubmitting ? "Đang lưu…" : "Lưu sản phẩm"}</Button></div>
      </fieldset></form></TabsContent>
      {history && <TabsContent value="stock"><section className="space-y-4 rounded-md border bg-white p-5"><h2 className="font-medium">Lịch sử tồn kho</h2>{!history.movements.length && <p className="py-8 text-sm text-stone-500">Chưa có thay đổi tồn kho.</p>}{history.movements.map((movement) => <article key={movement.id} className="flex flex-wrap justify-between gap-3 border-b pb-4 text-sm"><div><p className="font-medium">{movement.variant}</p><p className="mt-1 text-xs text-stone-500">{formatDateTime(movement.createdAt)} · {reasons[movement.reason] ?? movement.reason} · {movement.actorName || "Hệ thống"}</p>{movement.orderId && <Link href={`/admin/orders/${movement.orderId}`} className="text-xs underline">{movement.orderCode}</Link>}{movement.note && <p className="mt-2 text-xs break-words text-stone-500">{movement.note}</p>}</div><div className="text-right"><p className={movement.delta >= 0 ? "font-medium text-emerald-700" : "font-medium text-destructive"}>{movement.delta > 0 ? "+" : ""}{movement.delta}</p><p className="text-xs text-stone-400">Tồn sau: {movement.stockAfter}</p></div></article>)}<div className="flex flex-wrap justify-between gap-3 text-xs text-stone-500"><span>Trang {history.page} / {history.totalPages}</span><div className="flex gap-4">{history.page > 1 && <Link href={`?tab=stock&page=${history.page - 1}`}>Trước</Link>}{history.page < history.totalPages && <Link href={`?tab=stock&page=${history.page + 1}`}>Sau</Link>}</div></div></section></TabsContent>}
    </Tabs><SizeChartDialog open={chartOpen} onClose={() => setChartOpen(false)} onCreated={(chart) => { setCharts([...charts, chart]); form.setValue("sizeChartId", chart.id, { shouldDirty: true }); }} />
  </div>;
}
