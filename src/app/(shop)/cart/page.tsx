import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shop/common/Breadcrumb";
import { CartPageView } from "@/components/shop/cart/CartPageView";

export const metadata: Metadata = { title: "Giỏ hàng | Cham.stu", robots: { index: false, follow: false } };

export default function CartPage() {
  return <div className="shop-container py-6 pb-16"><Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng", href: "/cart" }]} /><h1 className="mt-8 text-center text-xl font-semibold tracking-wider md:text-2xl">GIỎ HÀNG</h1><CartPageView /></div>;
}
