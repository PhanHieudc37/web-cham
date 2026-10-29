import { notFound } from "next/navigation";
import { idSchema } from "@/lib/validation/common";
import { requireRolePage } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { getOrderService } from "@/server/services/order.service";
import { OrderDetail } from "@/components/admin/orders/OrderDetail";
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await params).id);
  await requireRolePage("staff", "/admin/orders");
  if (!parsed.success) notFound();
  const order = await getOrderService().getAdminDetail(parsed.data).catch((error: unknown) => { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; });
  return <OrderDetail order={order} />;
}
