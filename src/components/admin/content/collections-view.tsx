"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CollectionAdminDTO } from "@/types/content-admin";
import { deleteCollectionAction, reorderContentAction, saveCollectionAction } from "@/server/actions/admin/content";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "../common/confirm-dialog";
import { AdminImage } from "../common/admin-image";
import { ListPagination } from "../common/list-pagination";
export function CollectionsView({ collections, page, totalPages, total }: { collections: CollectionAdminDTO[]; page: number; totalPages: number; total: number }) {
  const router = useRouter(), hydrated = useHydrated();
  const [deleting, setDeleting] = useState<CollectionAdminDTO | null>(null), [pending, setPending] = useState(false);
  async function move(id: string, direction: "up" | "down") { setPending(true); const result = await reorderContentAction({ kind: "collections", id, direction }); setPending(false); if (!result.ok) toast.error(result.error.message); else router.refresh(); }
  return <div data-content-ready={hydrated} className="space-y-6"><div className="flex flex-wrap justify-between gap-4"><div><p className="mb-2 text-[10px] tracking-[0.18em] text-stone-400">CỬA HÀNG / BỘ SƯU TẬP</p><h1 className="text-2xl font-semibold md:text-3xl">Bộ sưu tập</h1><p className="mt-2 text-sm text-stone-500">Tạo những nhóm sản phẩm mang câu chuyện riêng.</p></div><Button asChild className="h-11 gap-2 px-4"><Link href="/admin/collections/new"><Plus size={16} />Thêm bộ sưu tập</Link></Button></div>
    <section className="divide-y rounded-md border bg-white">{!collections.length && <p className="p-10 text-center text-sm text-stone-500">Chưa có bộ sưu tập.</p>}{collections.map((collection) => <article key={collection.id} className="flex flex-wrap items-center gap-4 p-4"><AdminImage src={collection.bannerUrl} alt={collection.title} className="size-16 rounded-md bg-stone-50" /><div className="min-w-0 flex-1"><Link href={`/admin/collections/${collection.id}`} className="text-sm font-medium break-words hover:underline">{collection.title}</Link><p className="mt-1 text-xs break-all text-stone-400">/{collection.slug} · {collection.productCount} sản phẩm</p></div><div className="flex w-full flex-wrap items-center gap-4 md:w-auto">{([['isActive', 'Hiển thị'], ['showOnHome', 'Trang chủ'], ['showInMenu', 'Menu']] as const).map(([key, label]) => <label key={key} className="flex min-h-10 items-center gap-2 text-xs"><input type="checkbox" key={`${key}-${collection[key]}`} defaultChecked={collection[key]} disabled={!hydrated || pending} aria-label={`${label} ${collection.title}`} onChange={async (event) => { const element = event.currentTarget; element.disabled = true; const result = await saveCollectionAction({ ...collection, [key]: element.checked }); if (!result.ok) { element.checked = collection[key]; element.disabled = false; toast.error(result.error.message); } else router.refresh(); }} />{label}</label>)}</div>
      <div className="ml-auto flex"><Button variant="ghost" size="icon" aria-label={`Đưa ${collection.title} lên`} disabled={pending} onClick={() => void move(collection.id, "up")}><ArrowUp size={15} /></Button><Button variant="ghost" size="icon" aria-label={`Đưa ${collection.title} xuống`} disabled={pending} onClick={() => void move(collection.id, "down")}><ArrowDown size={15} /></Button><Button asChild variant="ghost" size="icon" aria-label={`Sửa ${collection.title}`}><Link href={`/admin/collections/${collection.id}`}><Pencil size={15} /></Link></Button><Button variant="ghost" size="icon" aria-label={`Xóa ${collection.title}`} onClick={() => setDeleting(collection)}><Trash2 size={15} /></Button></div></article>)}</section>
    <ListPagination path="/admin/collections" page={page} totalPages={totalPages} total={total} /><ConfirmDialog open={Boolean(deleting)} title="Xóa bộ sưu tập?" description="Sản phẩm trong bộ sưu tập vẫn được giữ nguyên." onClose={() => setDeleting(null)} onConfirm={async () => { const result = await deleteCollectionAction({ id: deleting?.id }); if (result.ok) router.refresh(); return result; }} />
  </div>;
}
