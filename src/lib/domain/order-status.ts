import type { OrderStatus } from "@/lib/constants";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"], confirmed: ["shipping", "cancelled"], shipping: ["completed", "returned"],
  completed: ["returned"], cancelled: [], returned: [],
};
export const getNextStatuses = (status: OrderStatus): readonly OrderStatus[] => transitions[status];
export const canTransition = (from: OrderStatus, to: OrderStatus): boolean => transitions[from].includes(to);
export const restoresStock = (status: OrderStatus): boolean => status === "cancelled" || status === "returned";
