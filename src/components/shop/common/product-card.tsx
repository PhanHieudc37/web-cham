import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductCardDTO } from "@/types/dto";
import { ShopImage } from "./shop-image";

export function PriceTag({ price, compareAtPrice }: Pick<ProductCardDTO, "price" | "compareAtPrice">) {
  const sale = compareAtPrice !== null && compareAtPrice > price;
  return <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] md:text-sm">
    <span className={sale ? "font-semibold text-sale" : "font-semibold"}>{formatPrice(price)}</span>
    {sale && <del className="text-xs text-muted">{formatPrice(compareAtPrice)}</del>}
  </span>;
}

export function ProductCard({ product }: { product: ProductCardDTO }) {
  return <Link href={`/products/${product.slug}`} className="product-card group block min-w-0" data-testid="product-card">
    <div className="relative aspect-square overflow-hidden bg-image-bg">
      <ShopImage src={product.image?.url ?? null} alt={product.image?.alt || product.name}
        sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="object-contain" />
      {product.hoverImage && <ShopImage src={product.hoverImage.url} alt="" sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="product-hover-image object-contain" />}
      <div className="absolute top-2 left-2 flex flex-col items-start gap-1 text-[10px] font-semibold tracking-wider md:top-3 md:left-3">
        {product.discountPercent !== null && <span className="bg-sale px-2 py-1 text-white">-{product.discountPercent}%</span>}
        {product.isNew && <span className="bg-fg px-2 py-1 text-white">NEW</span>}
      </div>
      {product.isSoldOut && <div className="absolute inset-0 flex items-center justify-center bg-white/50"><span className="bg-white px-3 py-2 text-xs font-semibold tracking-wider">HẾT HÀNG</span></div>}
    </div>
    <h3 className="mt-4 mb-2 line-clamp-2 text-[13px] leading-relaxed font-medium uppercase md:text-sm">{product.name}</h3>
    <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
    {product.colors.length > 0 && <div className="mt-3 flex items-center gap-1.5" aria-label={`Màu sắc: ${product.colors.map(({ name }) => name).join(", ")}`}>
      {product.colors.slice(0, 5).map((color, index) => <span key={`${color.name}-${index}`} title={color.name} className="size-3.5 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />)}
      {product.colors.length > 5 && <span className="text-[10px] text-muted">+{product.colors.length - 5}</span>}
    </div>}
  </Link>;
}

export function ProductSection({ title, slug, products }: { title: string; slug: string; products: ProductCardDTO[] }) {
  if (!products.length) return null;
  return <section className="shop-container shop-section" aria-label={title}>
    <h2 className="shop-section-title">{title}</h2>
    <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 md:mt-9 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
    <div className="mt-8 text-center"><Link href={`/collections/${slug}`} className="shop-button">XEM TẤT CẢ<span className="sr-only"> {title}</span></Link></div>
  </section>;
}
