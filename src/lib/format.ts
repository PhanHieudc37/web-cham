export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount)}₫`;
}

export function formatDateTime(value: string | Date): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date).replace(", ", " ");
}

export function maskPhone(phone: string): string {
  return phone.length >= 7 ? `${phone.slice(0, 4)}***${phone.slice(-3)}` : "***";
}
