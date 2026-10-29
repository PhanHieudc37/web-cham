import { notFound } from "next/navigation";
import { idSchema } from "@/lib/validation/common";
import { formatDateTime, formatPrice } from "@/lib/format";
import { requireRolePage } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { getOrderService } from "@/server/services/order.service";
import { getPublicSettings } from "@/server/services/settings.service";
import { PrintOrder } from "@/components/admin/orders/PrintOrder";
import "./print.css";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await params).id);
  await requireRolePage("staff", "/admin/orders");
  if (!parsed.success) notFound();
  const order = await getOrderService().getAdminDetail(parsed.data).catch((error: unknown) => { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; });
  const { shop } = await getPublicSettings();
  const terminal = order.status === "cancelled" || order.status === "returned";
  const payment = terminal ? "Đơn đã hủy / hoàn trả – Không giao hàng, không thu tiền" : order.paymentStatus === "paid" ? "Đã thanh toán – Không thu tiền" : order.paymentStatus === "refunded" ? "Đã hoàn tiền – Không thu tiền" : order.paymentMethod === "cod" ? `Thu hộ (COD): ${formatPrice(order.total)}` : "Chuyển khoản chưa xác nhận – Không thu hộ";
  return <><PrintOrder /><article id="delivery-note" className="mx-auto max-w-[560px] space-y-5 bg-white p-4 text-sm text-black sm:p-8"><header className="border-b-2 border-black pb-4"><p className="text-xl font-bold">{shop.name}</p>{shop.phone && <p className="mt-1">{shop.phone}</p>}<h1 className="mt-5 text-2xl font-bold break-all">{order.code}</h1><p className="mt-1 text-xs">{formatDateTime(order.createdAt)}</p></header><section className="space-y-2 break-words"><h2 className="font-bold">NGƯỜI NHẬN</h2><p className="text-base font-bold">{order.customerName}</p><p>{order.customerPhone}</p><p>{[order.addressLine, order.ward, order.province].join(", ")}</p></section><table className="w-full table-fixed border-collapse text-left text-xs"><thead><tr className="border-y border-black"><th className="py-2">Sản phẩm</th><th className="w-20 py-2">Màu / Size</th><th className="w-10 py-2 text-right">SL</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="break-inside-avoid border-b"><td className="py-3 pr-2 break-words">{item.productName}</td><td className="py-3 break-words">{item.colorName} / {item.size}</td><td className="py-3 text-right">{item.quantity}</td></tr>)}</tbody></table><p className="border-2 border-black p-4 text-base font-bold">{payment}</p>{order.note && <section className="space-y-2 break-words whitespace-pre-wrap"><h2 className="font-bold">Ghi chú của khách</h2><p>{order.note}</p></section>}</article></>;
}
