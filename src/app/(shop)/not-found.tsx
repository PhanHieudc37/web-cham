import Link from "next/link";
export default function NotFound() {
  return <div className="shop-container py-24 text-center"><p className="mb-4 text-xs tracking-[0.2em] text-muted">404</p><h1 className="shop-section-title">Không tìm thấy trang</h1><p className="mt-5 text-sm leading-7 text-muted">Trang bạn tìm không tồn tại hoặc sản phẩm đã ngừng bán.</p><Link href="/" className="shop-button shop-button-primary mt-8">Về trang chủ</Link></div>;
}
