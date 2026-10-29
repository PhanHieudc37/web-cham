"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { orderNoteSchema, shippingInputSchema } from "@/lib/validation/order-admin";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { OrderAdminDetailDTO } from "@/types/dto";
import { addOrderNoteAction, saveOrderShippingAction } from "@/server/actions/admin/orders";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/admin/common/form-field";
import { CARRIERS } from "./OrderActions";

export function ShippingForm({ order }: { order: OrderAdminDetailDTO }) {
  const router = useRouter();
  const form = useForm<z.input<typeof shippingInputSchema>, unknown, z.output<typeof shippingInputSchema>>({ resolver: zodResolver(shippingInputSchema), defaultValues: { orderId: order.id, carrier: order.carrier ?? "", trackingCode: order.trackingCode ?? "" } });
  useUnsavedChanges(form.formState.isDirty);
  return <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => { const result = await saveOrderShippingAction(values); if (!result.ok) { toast.error(result.error.message); return; } form.reset(values); toast.success("Đã lưu"); router.refresh(); })}><h2 className="font-medium">Vận chuyển</h2><FormField id="carrier" label="Hãng vận chuyển (chọn hoặc nhập Khác)" list="carriers" maxLength={60} error={form.formState.errors.carrier?.message} {...form.register("carrier")} /><datalist id="carriers">{CARRIERS.map((carrier) => <option value={carrier} key={carrier} />)}</datalist><FormField id="tracking" label="Mã vận đơn" maxLength={100} error={form.formState.errors.trackingCode?.message} {...form.register("trackingCode")} /><div className={form.formState.isDirty ? "fixed inset-x-0 bottom-0 z-20 border-t bg-white p-3 md:static md:border-0 md:p-0 md:py-2" : "py-2"}><Button type="submit" className="h-11 w-full sm:w-auto" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Đang lưu…" : "Lưu vận chuyển"}</Button></div></form>;
}
export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const form = useForm<z.input<typeof orderNoteSchema>, unknown, z.output<typeof orderNoteSchema>>({ resolver: zodResolver(orderNoteSchema), defaultValues: { orderId, message: "" } });
  useUnsavedChanges(form.formState.isDirty);
  return <form className="space-y-3" onSubmit={form.handleSubmit(async (values) => { const result = await addOrderNoteAction(values); if (!result.ok) { toast.error(result.error.message); return; } form.reset({ orderId, message: "" }); toast.success("Đã lưu"); router.refresh(); })}><h2 className="font-medium"><label htmlFor="internal-note">Ghi chú nội bộ</label></h2><textarea id="internal-note" rows={3} maxLength={1000} className="w-full resize-y rounded-md border p-3 text-sm" {...form.register("message")} aria-invalid={Boolean(form.formState.errors.message)} /><p className="text-xs text-stone-500">Chỉ nhân viên thấy. Mỗi ghi chú được lưu trong lịch sử đơn.</p>{form.formState.errors.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.message.message}</p>}<Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Đang lưu…" : "Thêm ghi chú"}</Button></form>;
}
export function CopyAddress({ address }: { address: string }) {
  return <Button variant="outline" className="mt-3 h-11 text-xs" onClick={async () => { try { await navigator.clipboard.writeText(address); toast.success("Đã sao chép địa chỉ"); } catch { toast.error("Không sao chép được. Vui lòng chọn và sao chép địa chỉ."); } }}>Sao chép địa chỉ</Button>;
}
