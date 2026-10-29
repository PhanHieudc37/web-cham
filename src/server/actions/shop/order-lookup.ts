"use server";

import { orderLookupSchema } from "@/lib/validation/checkout";
import { getClientIp } from "@/server/request";
import { runAction } from "@/server/run-action";
import { getOrderService } from "@/server/services/order.service";

export async function lookupOrderAction(input: unknown) {
  return runAction(async () => {
    const values = orderLookupSchema.parse(input);
    // Public endpoint: require both credentials and enforce the IP quota in the service.
    return getOrderService().lookupPublic(values, await getClientIp());
  });
}
