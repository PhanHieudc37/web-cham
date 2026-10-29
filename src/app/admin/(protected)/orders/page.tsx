import Link from "next/link";
import { orderFiltersSchema } from "@/lib/order-admin";
import { requireRolePage } from "@/server/auth/guards";
import { getOrderAdminService } from "@/server/services/order-admin.service";
import { OrdersList } from "@/components/admin/orders/OrdersList";
export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = orderFiltersSchema.safeParse(await searchParams);
  const actor = await requireRolePage("staff", "/admin/orders");
  if (!parsed.success) return <div className="space-y-4"><h1 className="text-2xl font-semibold">Bộ lọc chưa hợp lệ</h1><p className="text-sm">Kiểm tra khoảng ngày, trạng thái và số trang.</p><Link href="/admin/orders" className="underline">Xóa bộ lọc</Link></div>;
  const data = await getOrderAdminService().list(parsed.data).catch(() => { throw new Error("Không thể tải danh sách đơn hàng. Vui lòng thử lại."); });
  return <OrdersList data={data} filters={parsed.data} admin={actor.role === "admin"} />;
}
