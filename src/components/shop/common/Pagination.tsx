import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, pathname, query }: { page: number; totalPages: number; pathname: string; query: string }) {
  if (totalPages <= 1) return null;
  function href(number: number) { const params = new URLSearchParams(query); params.set("page", String(number)); return `${pathname}?${params}#product-grid`; }
  const visible = [...new Set([1, ...Array.from({ length: 5 }, (_, index) => page + index - 2).filter((number) => number > 1 && number < totalPages), totalPages])].sort((a, b) => a - b);
  const button = "flex size-11 items-center justify-center border text-sm transition-colors hover:bg-fg hover:text-white";
  return <nav aria-label="Phân trang" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
    {page > 1 ? <Link href={href(page - 1)} className={button} aria-label="Trang trước"><ChevronLeft size={16} /></Link> : <span aria-disabled="true" className={`${button} opacity-30`}><ChevronLeft size={16} /></span>}
    {visible.map((number, index) => <span key={number} className="flex items-center gap-1.5">
      {index > 0 && number - visible[index - 1] > 1 && <span className="px-1 text-muted" aria-hidden>…</span>}
      <Link href={href(number)} aria-label={`Trang ${number}`} aria-current={page === number ? "page" : undefined} className={`${button} ${page === number ? "border-fg bg-fg text-white" : ""}`}>{number}</Link>
    </span>)}
    {page < totalPages ? <Link href={href(page + 1)} className={button} aria-label="Trang sau"><ChevronRight size={16} /></Link> : <span aria-disabled="true" className={`${button} opacity-30`}><ChevronRight size={16} /></span>}
  </nav>;
}
