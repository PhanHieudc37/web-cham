"use client";
import { useEffect, useState } from "react";
import type { ProductChoiceDTO } from "@/types/content-admin";
import { findCollectionProductsAction } from "@/server/actions/admin/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AdminImage } from "../common/admin-image";

export function ProductPicker({ open, selected, onClose, onAdd }: { open: boolean; selected: string[]; onClose: () => void; onAdd: (products: ProductChoiceDTO[]) => void }) {
  const [query, setQuery] = useState(""), [page, setPage] = useState(1), [results, setResults] = useState<ProductChoiceDTO[]>([]), [totalPages, setTotalPages] = useState(1), [error, setError] = useState(""), [loading, setLoading] = useState(false), [picked, setPicked] = useState<ProductChoiceDTO[]>([]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setTimeout(() => { setLoading(true); void findCollectionProductsAction({ query, page }).then((result) => { if (!active) return; setLoading(false); if (!result.ok) { setError(result.error.message); return; } setResults(result.data.products); setTotalPages(result.data.totalPages); }); }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, query, page]);
  return <Dialog open={open} onOpenChange={(value) => { if (!value) { setPicked([]); onClose(); } }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-md sm:max-w-xl"><DialogHeader><DialogTitle>Chọn sản phẩm</DialogTitle><DialogDescription>Tìm và chọn nhiều sản phẩm cho bộ sưu tập.</DialogDescription></DialogHeader><Input aria-label="Tìm sản phẩm cho bộ sưu tập" value={query} placeholder="Tên hoặc mã sản phẩm" onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
    {loading && <p className="text-xs text-stone-400">Đang tìm…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="max-h-80 space-y-2 overflow-y-auto">{results.map((product) => <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm"><input type="checkbox" disabled={selected.includes(product.id)} checked={selected.includes(product.id) || picked.some((entry) => entry.id === product.id)} aria-label={`Chọn ${product.name}`} onChange={(event) => setPicked(event.target.checked ? [...picked, product] : picked.filter((entry) => entry.id !== product.id))} /><AdminImage src={product.imageUrl} alt="" className="size-10" /><span className="min-w-0 flex-1 break-words">{product.name}<span className="block text-xs text-stone-400">{product.code}</span></span></label>)}</div><div className="flex items-center justify-between text-xs text-stone-500"><Button type="button" variant="ghost" className="h-9 px-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page} / {totalPages}</span><Button type="button" variant="ghost" className="h-9 px-2" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</Button></div><Button type="button" className="h-11" disabled={!picked.length} onClick={() => { onAdd(picked); setPicked([]); onClose(); }}>Thêm {picked.length} sản phẩm</Button>
  </DialogContent></Dialog>;
}
