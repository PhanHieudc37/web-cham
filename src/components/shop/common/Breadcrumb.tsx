import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items }: { items: { label: string; href: string }[] }) {
  return <nav aria-label="Đường dẫn" className="py-5 text-xs leading-6 text-muted"><ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
    {items.map((item, index) => <li key={`${item.href}-${index}`} className="flex min-w-0 items-center gap-2">
      {index > 0 && <ChevronRight size={12} className="shrink-0" aria-hidden />}
      {index === items.length - 1 ? <span aria-current="page" className="wrap-anywhere text-fg">{item.label}</span> : <Link href={item.href} className="hover:text-fg">{item.label}</Link>}
    </li>)}
  </ol></nav>;
}
