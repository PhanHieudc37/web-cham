import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { z } from "zod";
import { getOrderService } from "@/server/services/order.service";
import { getPublicSettings } from "@/server/services/settings.service";
import { AppError } from "@/server/errors";
import { formatPrice } from "@/lib/format";
import { CopyButton } from "@/components/shop/common/CopyButton";
import { BankTransferInfo } from "@/components/shop/checkout/BankTransferInfo";
import { ShopImage } from "@/components/shop/common/shop-image";
import { getServerEnv } from "@/server/env";

export const metadata: Metadata = { title: "Đặt hàng thành công | Cham.stu" };
const accessSchema = z.object({ code: z.string().min(1).max(24).regex(/^[A-Z0-9]+$/), t: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });
export default async function SuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = accessSchema.safeParse(await searchParams);
  if (!query.success) notFound();
  const order = await getOrderService().getSuccess(query.data.code, query.data.t).catch((error: unknown) => { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; });
  const settings = await getPublicSettings();
  const emailEnabled = getServerEnv().EMAIL_DELIVERY !== "disabled";
  return <div className="mx-auto max-w-[760px]"><div className="text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full border border-success text-success"><Check size={28} /></span><h1 className="mt-6 text-xl leading-relaxed font-semibold tracking-wider sm:text-2xl">CẢM ƠN BẠN ĐÃ ĐẶT HÀNG!</h1><p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">Mã đơn hàng: <strong data-testid="order-code">{order.code}</strong><CopyButton value={order.code} label="mã đơn hàng" /></p></div>
    <section aria-label="Chi tiết đơn hàng" className="mt-8 border p-5 sm:p-8"><h2 className="mb-6 text-sm font-semibold tracking-wider">THÔNG TIN ĐƠN HÀNG</h2><ul className="space-y-5">{order.items.map((item) => <li key={item.id} className="flex min-w-0 gap-4"><div className="relative size-16 shrink-0 bg-image-bg"><ShopImage src={item.imageUrl} alt={item.productName} sizes="64px" className="object-contain" /></div><div className="min-w-0 flex-1 text-xs leading-6"><p className="font-medium wrap-anywhere uppercase">{item.productName}</p><p className="text-muted">{item.colorName} / {item.size} × {item.quantity}</p><p>{formatPrice(item.lineTotal)}</p></div></li>)}</ul><dl className="mt-6 space-y-3 border-t pt-5 text-sm"><div className="flex justify-between gap-4"><dt>Tạm tính</dt><dd>{formatPrice(order.subtotal)}</dd></div><div className="flex justify-between gap-4"><dt>Phí vận chuyển</dt><dd>{order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}</dd></div><div className="flex justify-between gap-4 border-t pt-4 font-semibold"><dt>Tổng cộng</dt><dd data-testid="receipt-total">{formatPrice(order.total)}</dd></div></dl><div className="mt-6 border-t pt-5 text-sm leading-7"><p className="font-medium">Địa chỉ giao hàng</p><p className="mt-2 wrap-anywhere">{order.customerName} — {order.customerPhone}</p><p className="wrap-anywhere">{order.addressLine}, {order.ward}, {order.province}</p><p className="mt-3">{order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.paymentStatus === "paid" ? "Đã nhận thanh toán ✓" : "Chờ thanh toán chuyển khoản"}</p></div></section>
    <BankTransferInfo order={order} />{!emailEnabled && <p role="note" className="mt-6 border p-4 text-center text-sm leading-7">Website hiện chưa gửi email tự động. Hãy lưu mã đơn và dùng số điện thoại đặt hàng để <Link href="/kiem-tra-don-hang" className="underline">tra cứu trạng thái đơn hàng</Link>.</p>}<p className="mt-8 text-center text-sm leading-7">Shop sẽ liên hệ xác nhận đơn qua điện thoại/Zalo trong vòng 24 giờ.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/collections/all" className="shop-button shop-button-primary">TIẾP TỤC MUA SẮM</Link>{settings.shop.zaloPhone && <a href={`https://zalo.me/${settings.shop.zaloPhone}`} target="_blank" rel="noopener noreferrer" className="shop-button">NHẮN ZALO CHO SHOP</a>}</div>
  </div>;
}
