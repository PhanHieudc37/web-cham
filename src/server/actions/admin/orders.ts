"use server";

import { after } from "next/server";
import { orderNoteSchema, orderPaymentSchema, orderStatusInputSchema, shippingInputSchema } from "@/lib/validation/order-admin";
import { requireRole } from "@/server/auth/guards";
import { CACHE_TAGS, invalidate } from "@/server/cache";
import { runAction } from "@/server/run-action";
import { getOrderService } from "@/server/services/order.service";
import { notifyOrderShipped } from "@/server/services/notification.service";
import { getPublicSettings } from "@/server/services/settings.service";

export async function changeOrderStatusAction(input: unknown) {
  return runAction(async () => {
    const values = orderStatusInputSchema.parse(input);
    const actor = await requireRole("staff"), service = getOrderService();
    await service.updateStatus(values, actor.id);
    invalidate(CACHE_TAGS.products);
    const order = await service.getAdminDetail(values.orderId);
    if (values.toStatus === "shipping" && order.trackingCode && order.customerEmail) after(async () => {
      try { await notifyOrderShipped(order, (await getPublicSettings()).shop.name); }
      catch { console.error("[notification] Shipping notification failed", { orderCode: order.code }); }
    });
    return order;
  });
}
export async function changeOrderPaymentAction(input: unknown) {
  return runAction(async () => {
    const values = orderPaymentSchema.parse(input);
    const actor = await requireRole("staff"), service = getOrderService();
    if (values.paymentStatus === "paid") await service.markPaid(values.orderId, actor.id);
    else await service.markRefunded(values.orderId, actor.id);
    return service.getAdminDetail(values.orderId);
  });
}
export async function saveOrderShippingAction(input: unknown) {
  return runAction(async () => {
    const values = shippingInputSchema.parse(input);
    const actor = await requireRole("staff"), service = getOrderService();
    await service.updateShipping(values.orderId, values.carrier, values.trackingCode, actor.id);
    return service.getAdminDetail(values.orderId);
  });
}
export async function addOrderNoteAction(input: unknown) {
  return runAction(async () => {
    const values = orderNoteSchema.parse(input);
    const actor = await requireRole("staff"), service = getOrderService();
    await service.addNote(values.orderId, values.message, actor.id);
    return service.getAdminDetail(values.orderId);
  });
}
