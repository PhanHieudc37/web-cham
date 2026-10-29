import { z } from "zod";
import { ORDER_STATUSES } from "./constants";

const day = z.union([z.literal(""), z.iso.date({ error: "Ngày không hợp lệ" })]).default("");
export const orderFiltersSchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["", ...ORDER_STATUSES]).default(""),
  from: day, to: day,
  paymentMethod: z.enum(["", "cod", "bank_transfer"]).default(""),
  paymentStatus: z.enum(["", "unpaid", "paid", "refunded"]).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
}).refine((v) => !v.from || !v.to || v.from <= v.to, { path: ["to"], error: "Ngày kết thúc phải từ ngày bắt đầu trở đi" });
export type OrderFilters = z.output<typeof orderFiltersSchema>;
export function orderQuery(filters: OrderFilters, changes: Partial<OrderFilters> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...changes })) if (value && !(key === "page" && value === 1)) params.set(key, String(value));
  return params.toString();
}
export function vietnamDay(date: Date) {
  return new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10);
}
export function dayStart(day: string) { return new Date(`${day}T00:00:00+07:00`); }
export function shiftDay(day: string, delta: number) { return new Date(dayStart(day).getTime() + delta * 86400000 + 7 * 3600000).toISOString().split("T")[0]; }
export function csvRow(values: (string | number | null)[]) {
  return values.map((value) => {
    const text = String(value ?? "");
    const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(",") + "\r\n";
}
