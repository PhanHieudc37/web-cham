import type { OrderStatus } from "@/lib/constants";
import type { OrderAdminListItemDTO } from "./dto";

export type OrderListDTO = { items: OrderAdminListItemDTO[]; total: number; page: number; totalPages: number; counts: Record<OrderStatus | "all", number> };
export type DashboardDTO = {
  todayOrders: number; pending: number; unpaidTransfer: number;
  revenue: null | { today: number; week: number; month: number; days: { date: string; total: number }[] };
  latest: OrderAdminListItemDTO[];
  lowStock: { id: string; productId: string; name: string; color: string; size: string; stock: number; image: string | null }[];
  lowStockTotal: number; threshold: number;
};
