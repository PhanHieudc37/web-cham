import { getPageMetadata } from "@/server/services/seo.service";
import { OrderLookupForm } from "@/components/shop/order/OrderLookupForm";
export async function generateMetadata() { return getPageMetadata({ title: "Kiểm tra đơn hàng | Cham.stu", path: "/kiem-tra-don-hang", noindex: true }); }
export default function OrderLookupPage() {
  return <div className="shop-container py-12 md:py-16"><header className="mx-auto mb-8 max-w-xl text-center"><p className="text-[10px] tracking-[0.2em] text-muted">ĐƠN HÀNG CỦA BẠN</p><h1 className="shop-section-title mt-4">Kiểm tra đơn hàng</h1><p className="mt-4 text-sm leading-7 text-muted">Nhập mã đơn và số điện thoại đã dùng khi đặt hàng để xem tiến trình giao hàng.</p></header><OrderLookupForm /></div>;
}
