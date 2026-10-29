import { idSchema } from "@/lib/validation/common";

const CHECKOUT_KEY = "cham-checkout-key-v1";
let fallbackKey: string | null = null;

export function getCheckoutKey(): string {
  try {
    const saved = sessionStorage.getItem(CHECKOUT_KEY);
    if (idSchema.safeParse(saved).success) return saved!;
    const key = fallbackKey ?? crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_KEY, key);
    fallbackKey = key;
    return key;
  } catch { return fallbackKey ??= crypto.randomUUID(); }
}
export function clearCheckoutKey() {
  fallbackKey = null;
  try { sessionStorage.removeItem(CHECKOUT_KEY); } catch { /* A blocked sessionStorage uses the in-memory key. */ }
}
