export function normalizeVietnamese(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();
}

export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s.()-]/g, "").replace(/^(?:\+84|84)/, "0");
}
