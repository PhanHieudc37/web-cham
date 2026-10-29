"use client";

import Link from "next/link";
export default function CheckoutError({ retry }: { error: unknown; retry: () => void }) {
  return <div className="py-16 text-center"><h1 className="text-xl font-semibold">Đã có lỗi xảy ra</h1><p className="mt-4 text-sm leading-7 text-muted">Vui lòng thử lại. Giỏ hàng vẫn được giữ nguyên trên trình duyệt.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={retry} className="shop-button shop-button-primary">Thử lại</button><Link href="/cart" className="shop-button">Về giỏ hàng</Link></div></div>;
}
