import Link from "next/link";
import { getListing } from "@/server/services/catalog.service";
import { ProductCard } from "@/components/shop/common/product-card";

export async function NotFoundContent() {
  const products = await getListing("best-seller").then((listing) => listing.products.slice(0, 4)).catch(() => []);
  return <div className="shop-container py-16 md:py-24"><header className="text-center"><p className="mb-4 text-xs tracking-[0.2em] text-muted">404</p><h1 className="shop-section-title">KHÔNG TÌM THẤY TRANG</h1><p className="mt-5 text-sm leading-7 text-muted">Trang bạn tìm không tồn tại hoặc sản phẩm đã ngừng bán.</p><Link href="/" className="shop-button shop-button-primary mt-8">VỀ TRANG CHỦ</Link></header>{products.length > 0 && <section aria-label="Sản phẩm bán chạy" className="mt-16"><h2 className="shop-section-title">BEST SELLER</h2><div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}</div>;
}
