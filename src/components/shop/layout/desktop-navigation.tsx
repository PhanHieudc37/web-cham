"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { MenuDTO } from "@/types/dto";
import { ShopImage } from "../common/shop-image";

export function DesktopNavigation({ menu }: { menu: MenuDTO }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function cancelClose() { if (timer.current) clearTimeout(timer.current); }
  function show() { cancelClose(); setOpen(true); }
  function delayedClose() { cancelClose(); timer.current = setTimeout(() => setOpen(false), 150); }
  const linkClass = "inline-flex min-h-11 items-center border-b-2 border-transparent hover:border-fg";
  return <nav aria-label="Menu chính" className="hidden min-w-0 flex-1 items-center gap-x-4 overflow-x-auto whitespace-nowrap text-xs font-semibold tracking-[0.06em] uppercase [scrollbar-width:none] lg:flex xl:gap-x-5"
    onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); trigger.current?.focus(); setOpen(false); } }}>
    <Link className={linkClass} href="/">HOME</Link>
    <Link className={linkClass} href="/collections/new-arrival">NEW ARRIVAL</Link>
    <div onMouseEnter={show} onMouseLeave={delayedClose} onFocus={show} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) delayedClose(); }}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls="shop-mega-menu" className={`${linkClass} gap-1`} onClick={() => { cancelClose(); setOpen(!open); }}>SHOP <ChevronDown size={13} /></button>
      {open && <div id="shop-mega-menu" className="absolute inset-x-0 top-full border-y bg-white whitespace-normal shadow-sm" onMouseEnter={show} onMouseLeave={delayedClose}>
        <div className="shop-container grid grid-cols-4 gap-8 py-9 text-sm font-normal normal-case tracking-normal">
          <div className={`${menu.featured?.bannerUrl ? "col-span-3" : "col-span-4"} grid grid-cols-3 gap-6`}>
            {menu.categories.map((category) => <div key={category.slug}>
              <Link href={`/collections/${category.slug}`} className="mb-3 block font-semibold uppercase" onClick={() => setOpen(false)}>{category.name}</Link>
              {category.children.map((child) => <Link href={`/collections/${child.slug}`} key={child.slug} className="block py-1.5 text-muted hover:text-fg" onClick={() => setOpen(false)}>{child.name}</Link>)}
            </div>)}
            <Link href="/collections/all" className="col-span-full mt-2 w-fit border-b border-fg pb-1 font-medium" onClick={() => setOpen(false)}>Xem tất cả sản phẩm</Link>
          </div>
          {menu.featured?.bannerUrl && <Link href={`/collections/${menu.featured.slug}`} className="relative aspect-[4/3] overflow-hidden bg-image-bg" onClick={() => setOpen(false)}>
            <ShopImage src={menu.featured.bannerUrl} alt={menu.featured.title} sizes="25vw" className="object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-4 pt-10 font-semibold text-white">{menu.featured.title}</span>
          </Link>}
        </div>
      </div>}
    </div>
    {menu.collections.map((collection) => <Link href={`/collections/${collection.slug}`} key={collection.slug} className={`${linkClass} max-w-36 truncate`} title={collection.title}>{collection.title}</Link>)}
    <Link className={linkClass} href="/collections/best-seller">BEST SELLER</Link>
    {menu.hasSale && <Link className={`${linkClass} text-sale`} href="/collections/sale">SALE</Link>}
    <Link className={linkClass} href="/gioi-thieu">ABOUT</Link>
    <Link className={linkClass} href="/kiem-tra-don-hang">CHECK ORDER</Link>
  </nav>;
}
