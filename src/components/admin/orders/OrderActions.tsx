"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { getNextStatuses } from "@/lib/domain/order-status";
import { orderStatusInputSchema } from "@/lib/validation/order-admin";
import type { OrderAdminDetailDTO } from "@/types/dto";
import { changeOrderPaymentAction, changeOrderStatusAction } from "@/server/actions/admin/orders";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/common/confirm-dialog";
import { FormField } from "@/components/admin/common/form-field";

const labels: Partial<Record<OrderStatus, string>> = { confirmed: "Xác nhận đơn", shipping: "Chuyển sang Đang giao", completed: "Hoàn thành", cancelled: "Hủy đơn", returned: "Hoàn trả" };
export const CARRIERS = ["GHN", "GHTK", "Viettel Post", "J&T Express", "SPX"];
function StatusDialog({ order, status, close }: { order: OrderAdminDetailDTO; status: OrderStatus; close: () => void }) {
  const router = useRouter();
  const form = useForm<z.input<typeof orderStatusInputSchema>, unknown, z.output<typeof orderStatusInputSchema>>({ resolver: zodResolver(orderStatusInputSchema), defaultValues: { orderId: order.id, toStatus: status, reason: "", carrier: order.carrier ?? "", trackingCode: order.trackingCode ?? "" } });
  return <ConfirmDialog open title={labels[status] ?? ORDER_STATUS_LABELS[status]} description={`Chuyển đơn ${order.code} sang ${ORDER_STATUS_LABELS[status].toLowerCase()}?`} onClose={close} onConfirm={async () => {
    if (!await form.trigger()) return { ok: false, error: { code: "VALIDATION_ERROR", message: "Vui lòng kiểm tra thông tin bên dưới." } };
    const result = await changeOrderStatusAction(form.getValues());
    if (result.ok) router.refresh();
    return result;
  }}>
    {status === "confirmed" && order.paymentMethod === "bank_transfer" && order.paymentStatus === "unpaid" && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Đơn chưa được thanh toán</p>}
    {status === "cancelled" && <div className="space-y-2"><label htmlFor="cancel-reason" className="text-sm font-medium">Lý do hủy *</label><input id="cancel-reason" list="cancel-reasons" maxLength={500} className="h-11 w-full rounded-md border px-3 text-sm" {...form.register("reason")} aria-invalid={Boolean(form.formState.errors.reason)} /><datalist id="cancel-reasons">{["Khách yêu cầu hủy", "Không liên lạc được khách", "Hết hàng", "Đơn trùng / spam", "Khác"].map((reason) => <option key={reason} value={reason} />)}</datalist>{form.formState.errors.reason && <p role="alert" className="text-sm text-destructive">{form.formState.errors.reason.message}</p>}<p className="text-xs text-stone-500">Sản phẩm trong đơn sẽ được hoàn kho.</p></div>}
    {status === "returned" && <p className="text-sm text-stone-600">Xác nhận đã nhận lại hàng. Sản phẩm sẽ được hoàn kho; thanh toán đã nhận cần hoàn tiền riêng.</p>}
    {status === "shipping" && <div className="space-y-4"><FormField id="dialog-carrier" label="Hãng vận chuyển (chọn hoặc nhập Khác)" list="dialog-carriers" maxLength={60} error={form.formState.errors.carrier?.message} {...form.register("carrier")} /><datalist id="dialog-carriers">{CARRIERS.map((carrier) => <option key={carrier} value={carrier} />)}</datalist><FormField id="dialog-tracking" label="Mã vận đơn" maxLength={100} error={form.formState.errors.trackingCode?.message} {...form.register("trackingCode")} /><p className="text-xs leading-5 text-stone-500">Có mã vận đơn và email khách: gửi email thông báo sau khi lưu.</p></div>}
  </ConfirmDialog>;
}
export function OrderActions({ order }: { order: OrderAdminDetailDTO }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | null>(null), [payment, setPayment] = useState<"paid" | "refunded" | null>(null);
  const terminal = order.status === "cancelled" || order.status === "returned";
  return <div className="space-y-3"><div className="flex flex-wrap gap-2">{getNextStatuses(order.status).map((next) => <Button key={next} className="h-11" variant={next === "cancelled" || next === "returned" ? "outline" : "default"} onClick={() => setStatus(next)}>{labels[next]}</Button>)}
    {!terminal && order.paymentMethod === "bank_transfer" && order.paymentStatus === "unpaid" && <Button variant="outline" className="h-11" onClick={() => setPayment("paid")}>Đã nhận tiền</Button>}
    {terminal && order.paymentStatus === "paid" && <Button variant="outline" className="h-11" onClick={() => setPayment("refunded")}>Đã hoàn tiền</Button>}</div>
    {status && <StatusDialog key={`${order.id}-${order.status}-${status}`} order={order} status={status} close={() => setStatus(null)} />}
    <ConfirmDialog open={Boolean(payment)} title={payment === "paid" ? "Đã nhận tiền" : "Đã hoàn tiền"} description={payment === "paid" ? "Chỉ xác nhận sau khi đã đối chiếu tiền thực nhận với ngân hàng." : "Chỉ xác nhận sau khi đã hoàn tiền cho khách."} onClose={() => setPayment(null)} onConfirm={async () => { const result = await changeOrderPaymentAction({ orderId: order.id, paymentStatus: payment }); if (result.ok) router.refresh(); return result; }} />
  </div>;
}
