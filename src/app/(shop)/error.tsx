"use client";

import Link from "next/link";

export default function ShopError({ retry }: { error: unknown; retry: () => void }) {
  return <div className="shop-container py-24 text-center"><h1 className="shop-section-title">Đã có lỗi xảy ra</h1><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">Vui lòng thử lại sau ít phút.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={retry} className="shop-button shop-button-primary">Thử lại</button><Link href="/" className="shop-button">Về trang chủ</Link></div></div>;
}
