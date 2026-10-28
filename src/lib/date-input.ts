export function toVietnameseDateInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value); if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 16);
}
export function fromVietnameseDateInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
