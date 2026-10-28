"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { MenuDTO, PublicSettingsDTO } from "@/types/dto";
import { SocialLinks } from "./social-links";

export function MobileMenu({ menu, settings }: { menu: MenuDTO; settings: PublicSettingsDTO }) {
  const [open, setOpen] = useState(false);
  const { shop, social } = settings;
  const support = Boolean(shop.phone || shop.email || shop.zaloPhone || social.messenger || social.facebook || social.instagram || social.tiktok || social.shopee);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><button type="button" aria-label="Mở menu" className="shop-icon-button lg:hidden"><Menu size={23} strokeWidth={1.5} /></button></SheetTrigger>
    <SheetContent side="left" className="shop-sheet w-[85%]! max-w-[360px]! gap-0 overflow-y-auto p-6">
      <SheetTitle className="mt-1 text-xl font-bold tracking-tight">{shop.name.toUpperCase()}</SheetTitle>
      <SheetDescription className="sr-only">Danh mục và liên kết cửa hàng</SheetDescription>
      <nav aria-label="Menu di động" className="mt-8 text-sm font-semibold tracking-wider uppercase" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
        <Link href="/" className="block border-b py-4">HOME</Link>
        <Link href="/collections/new-arrival" className="block border-b py-4">NEW ARRIVAL</Link>
        <Accordion type="single" collapsible>
          <AccordionItem value="shop"><AccordionTrigger className="py-4 font-semibold tracking-wider">SHOP</AccordionTrigger><AccordionContent className="h-auto!">
            <Link href="/collections/all" className="mb-2 block py-3 text-xs">Xem tất cả sản phẩm</Link>
            {menu.categories.map((category) => <details key={category.slug} className="border-t font-normal normal-case tracking-normal"><summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-medium">{category.name}<ChevronDown size={14} /></summary>
              <div className="border-l pl-3"><Link href={`/collections/${category.slug}`} className="block py-2">Tất cả {category.name.toLocaleLowerCase("vi")}</Link>
                {category.children.map((child) => <Link key={child.slug} href={`/collections/${child.slug}`} className="block py-2 text-muted">{child.name}</Link>)}
              </div>
            </details>)}
          </AccordionContent></AccordionItem>
        </Accordion>
        {menu.collections.map((collection) => <Link key={collection.slug} href={`/collections/${collection.slug}`} className="block border-b py-4 wrap-break-word">{collection.title}</Link>)}
        <Link href="/collections/best-seller" className="block border-b py-4">BEST SELLER</Link>
        {menu.hasSale && <Link href="/collections/sale" className="block border-b py-4 text-sale">SALE</Link>}
        <Link href="/gioi-thieu" className="block border-b py-4">ABOUT</Link>
        <Link href="/kiem-tra-don-hang" className="block border-b py-4">CHECK ORDER</Link>
      </nav>
      {support && <div className="mt-10 space-y-3 text-sm"><p className="font-semibold">Bạn cần hỗ trợ?</p>
        {shop.phone && <a href={`tel:${shop.phone}`} className="block">{shop.phone}</a>}
        {shop.email && <a href={`mailto:${shop.email}`} className="block break-all">{shop.email}</a>}
        {shop.zaloPhone && <a href={`https://zalo.me/${shop.zaloPhone.replace(/[^\d+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="block">Zalo</a>}
        {social.messenger && <a href={social.messenger} target="_blank" rel="noopener noreferrer" className="block">Messenger</a>}
        <SocialLinks social={social} />
      </div>}
    </SheetContent>
  </Sheet>;
}
