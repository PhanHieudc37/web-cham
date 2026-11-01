import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, pathname, query, onPageChange }: { page: number; totalPages: number; pathname: string; query: string; onPageChange?: (page: number) => void }) {
  if (totalPages <= 1) return null;
  function href(number: number) { const params = new URLSearchParams(query); params.set("page", String(number)); return `${pathname}?${params}#product-grid`; }
  const visible = [...new Set([1, ...Array.from({ length: 5 }, (_, index) => page + index - 2).filter((number) => number > 1 && number < totalPages), totalPages])].sort((a, b) => a - b);
  const button = "flex size-11 items-center justify-center border text-sm transition-colors hover:bg-fg hover:text-white";
  function pageLink(number: number, label: string, content: React.ReactNode) {
    const className = `${button} ${page === number ? "border-fg bg-fg text-white" : ""}`;
    return onPageChange ? <button type="button" onClick={() => onPageChange(number)} aria-label={label} aria-current={page === number ? "page" : undefined} className={className}>{content}</button>
      : <Link href={href(number)} aria-label={label} aria-current={page === number ? "page" : undefined} className={className}>{content}</Link>;
  }
  return <nav aria-label="Phân trang" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
    {page > 1 ? pageLink(page - 1, "Trang trước", <ChevronLeft size={16} />) : <span aria-disabled="true" className={`${button} opacity-30`}><ChevronLeft size={16} /></span>}
    {visible.map((number, index) => <span key={number} className="flex items-center gap-1.5">
      {index > 0 && number - visible[index - 1] > 1 && <span className="px-1 text-muted" aria-hidden>…</span>}
      {pageLink(number, `Trang ${number}`, number)}
    </span>)}
    {page < totalPages ? pageLink(page + 1, "Trang sau", <ChevronRight size={16} />) : <span aria-disabled="true" className={`${button} opacity-30`}><ChevronRight size={16} /></span>}
  </nav>;
}
