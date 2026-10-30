import Link from "next/link";
import { Gift, MessageCircle, RefreshCw, ShieldCheck, Truck, Wallet } from "lucide-react";
import type { HomeDTO, PublicSettingsDTO } from "@/types/dto";
import { ShopImage } from "../common/shop-image";

export function CategoryTiles({ home }: { home: HomeDTO }) {
  const tiles = home.categories.map((category) => ({ name: category.name, slug: category.slug, image: category.imageUrl }));
  if (home.sale.length) tiles.push({ name: "SALE", slug: "sale", image: home.sale[0].image?.url ?? null });
  if (!tiles.length) return null;
  return <section className="shop-container shop-section" aria-label="Danh mục sản phẩm"><div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
    {tiles.map((tile, index) => <Link key={tile.slug} href={`/collections/${tile.slug}`} className="group relative aspect-[3/4] overflow-hidden bg-image-bg">
      <ShopImage src={tile.image} alt="" sizes="(min-width:1024px) 25vw, 50vw" priority={index < 2} className="object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-4 text-lg font-semibold tracking-wider text-white uppercase md:p-6 md:text-xl">{tile.name}</span>
    </Link>)}
  </div></section>;
}

export function BrandStory({ settings, image }: { settings: PublicSettingsDTO; image: string | null }) {
  if (!settings.shop.description) return null;
  return <section className="shop-section bg-surface" aria-label="Câu chuyện thương hiệu"><div className="shop-container grid items-center md:grid-cols-2 md:gap-14">
    {image && <div className="relative aspect-[4/5] bg-image-bg"><ShopImage src={image} alt={settings.shop.name} sizes="(min-width:768px) 50vw, 100vw" className="object-cover" /></div>}
    <div className={`py-12 md:py-16 ${image ? "" : "md:col-span-2 md:mx-auto md:max-w-2xl md:text-center"}`}>
      <h2 className="mb-6 text-3xl font-bold tracking-[0.08em] uppercase">{settings.shop.name}</h2>
      <p className="whitespace-pre-line text-sm leading-8 text-muted">{settings.shop.description}</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/gioi-thieu" className="shop-button shop-button-primary">VỀ CHÚNG TÔI</Link>
        {settings.social.instagram && <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="shop-button">INSTAGRAM</a>}
      </div>
    </div>
  </div></section>;
}

export function PolicyStrip({ policies }: { policies: PublicSettingsDTO["policies"] }) {
  if (!policies.length) return null;
  const icons = { truck: Truck, refresh: RefreshCw, wallet: Wallet, message: MessageCircle, shield: ShieldCheck, gift: Gift };
  return <section className="shop-container shop-section" aria-label="Cam kết của cửa hàng"><div className="grid grid-cols-2 gap-x-5 gap-y-8 border-y py-9 lg:grid-cols-4">
    {policies.map((policy, index) => { const Icon = icons[policy.icon]; return <div key={`${policy.icon}-${index}`} className="flex flex-col items-center gap-3 text-center"><Icon size={25} strokeWidth={1.3} /><p className="max-w-56 text-xs leading-6">{policy.text}</p></div>; })}
  </div></section>;
}
