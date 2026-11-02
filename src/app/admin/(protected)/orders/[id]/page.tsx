import { notFound } from "next/navigation";
import { idSchema } from "@/lib/validation/common";
import { readAuthorizedPage } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { getOrderService } from "@/server/services/order.service";
import { OrderDetail } from "@/components/admin/orders/OrderDetail";
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const { data: order } = await readAuthorizedPage("staff", `/admin/orders/${parsed.data}`, () => getOrderService().getAdminDetail(parsed.data)).catch((error: unknown) => { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; });
  return <OrderDetail order={order} />;
}
