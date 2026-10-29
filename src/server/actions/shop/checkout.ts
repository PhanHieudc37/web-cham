"use server";

import { after } from "next/server";
import { checkoutSchema } from "@/lib/validation/checkout";
import { runAction } from "@/server/run-action";
import { getClientIp } from "@/server/request";
import { CACHE_TAGS, invalidate } from "@/server/cache";
import { getOrderService } from "@/server/services/order.service";
import { getPublicSettings } from "@/server/services/settings.service";
import { notifyOrderCreated } from "@/server/services/notification.service";

export async function placeOrderAction(input: unknown) {
  return runAction(async () => {
    const values = checkoutSchema.parse(input);
    // Public checkout. The service applies the IP rate limit before its transaction.
    const service = getOrderService();
    const result = await service.placeOrderWithOutcome(values, await getClientIp());
    if (result.createdOrderId) {
      invalidate(CACHE_TAGS.products);
      const orderId = result.createdOrderId;
      after(async () => {
        try {
          const [order, settings] = await Promise.all([service.getAdminDetail(orderId), getPublicSettings()]);
          await notifyOrderCreated(order, settings.shop.name, result.placement.accessToken);
        } catch { console.error("[notification] Order notification failed", { orderCode: result.placement.orderCode }); }
      });
    }
    return result.placement;
  });
}
