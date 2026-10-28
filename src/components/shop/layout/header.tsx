import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { MenuDTO, PublicSettingsDTO } from "@/types/dto";
import { ShopImage } from "../common/shop-image";
import { DesktopNavigation } from "./desktop-navigation";
import { MobileMenu } from "./mobile-menu";
import { SearchOverlay } from "./search-overlay";

export function Header({ menu, settings }: { menu: MenuDTO; settings: PublicSettingsDTO }) {
  return <header id="shop-header" className="shop-header sticky top-0 z-40 bg-white">
    <div className="shop-container flex h-16 items-center gap-2 lg:h-[72px] lg:gap-5">
      <MobileMenu menu={menu} settings={settings} />
      <Link href="/" aria-label={`${settings.shop.name} — Trang chủ`} className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
        {settings.shop.logoUrl ? <span className="relative block h-10 w-28"><ShopImage src={settings.shop.logoUrl} alt={settings.shop.name} sizes="112px" className="object-contain" priority /></span>
          : <span className="whitespace-nowrap text-xl font-bold tracking-[-0.06em] lg:text-2xl">{settings.shop.name.toUpperCase()}</span>}
      </Link>
      <DesktopNavigation menu={menu} />
      <div className="ml-auto flex shrink-0 items-center gap-0 lg:ml-0">
        <SearchOverlay />
        <Link href="/cart" className="shop-icon-button" aria-label="Giỏ hàng"><ShoppingBag size={20} strokeWidth={1.5} /></Link>
      </div>
    </div>
  </header>;
}
