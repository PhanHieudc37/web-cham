import Link from "next/link";
import type { Metadata } from "next";
import { getPublicSettings } from "@/server/services/settings.service";
import { ShopImage } from "@/components/shop/common/shop-image";
import { CartHydrator } from "@/components/shop/cart/CartHydrator";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const { shop } = await getPublicSettings();
  return <div className="shop-theme min-w-0"><CartHydrator /><header className="border-b bg-white"><div className="shop-container flex min-h-20 flex-wrap items-center justify-between gap-4 py-4"><Link href="/" aria-label={`${shop.name} — Trang chủ`}>{shop.logoUrl ? <span className="relative block h-10 w-28"><ShopImage src={shop.logoUrl} alt={shop.name} sizes="112px" className="object-contain" /></span> : <span className="text-xl font-bold tracking-[-0.06em]">{shop.name.toUpperCase()}</span>}</Link><Link href="/cart" className="min-h-10 py-3 text-xs underline underline-offset-4">‹ Quay lại giỏ hàng</Link></div></header><main className="shop-container py-10 pb-16">{children}</main></div>;
}
