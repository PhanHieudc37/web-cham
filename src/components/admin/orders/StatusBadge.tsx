import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatus, type PaymentStatus } from "@/lib/constants";
const colors = { pending: "bg-amber-50 text-amber-800", confirmed: "bg-blue-50 text-blue-800", shipping: "bg-purple-50 text-purple-800", completed: "bg-emerald-50 text-emerald-800", cancelled: "bg-stone-100 text-stone-600", returned: "bg-red-50 text-red-800", unpaid: "border-orange-300 text-orange-800", paid: "bg-emerald-50 text-emerald-800", refunded: "bg-stone-100 text-stone-600" };
export function StatusBadge({ status }: { status: OrderStatus | PaymentStatus }) {
  const label = status in ORDER_STATUS_LABELS ? ORDER_STATUS_LABELS[status as OrderStatus] : PAYMENT_STATUS_LABELS[status as PaymentStatus];
  return <span className={`inline-flex max-w-full rounded-md border px-2 py-1 text-[11px] font-medium ${status === "unpaid" ? "" : "border-transparent"} ${colors[status]}`}>{label}</span>;
}
