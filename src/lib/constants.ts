export const MAX_CART_LINES = 20;
export const MAX_QUANTITY_PER_LINE = 10;
export const MAX_VND = 2_147_483_647;
export const PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;
export const RESERVED_COLLECTION_SLUGS = ["all", "new-arrival", "best-seller", "sale"] as const;
export const ORDER_STATUSES = ["pending", "confirmed", "shipping", "completed", "cancelled", "returned"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = "cod" | "bank_transfer";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn thành", cancelled: "Đã hủy", returned: "Hoàn trả",
};
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán", refunded: "Đã hoàn tiền" };
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = { cod: "Thanh toán khi nhận hàng (COD)", bank_transfer: "Chuyển khoản" };
export const PRODUCT_STATUS_LABELS = { draft: "Nháp", active: "Đang bán", archived: "Lưu trữ" };
