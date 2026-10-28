"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import { cartRequestKey, useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import type { CartQuoteDTO } from "@/types/dto";
import type { ActionResult } from "@/lib/result";

const useQuoteStore = create<{
  quote: CartQuoteDTO | null; key: string; loading: boolean; error: string | null;
  reductions: Record<string, number>; refreshId: number; refresh: () => void;
}>((set) => ({ quote: null, key: "", loading: false, error: null, reductions: {}, refreshId: 0, refresh: () => set((state) => ({ refreshId: state.refreshId + 1 })) }));

// One controller in CartHydrator owns requests; drawer, badge and cart share its result.
export function useCartQuoteController() {
  const lines = useCartStore((state) => state.lines), code = useCartStore((state) => state.discountCode);
  const hydrated = useCartStore((state) => state.hasHydrated), open = useUiStore((state) => state.cartOpen);
  const refreshId = useQuoteStore((state) => state.refreshId), path = usePathname();
  const key = cartRequestKey(lines, code);
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    useQuoteStore.setState({ loading: true, error: null });
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: key, cache: "no-store", signal: controller.signal });
        const result: ActionResult<CartQuoteDTO> = await response.json();
        if (controller.signal.aborted || key !== cartRequestKey(useCartStore.getState().lines, useCartStore.getState().discountCode)) return;
        if (!result.ok) { useQuoteStore.setState({ loading: false, error: result.error.message }); return; }
        useQuoteStore.setState((state) => {
          const reductions: Record<string, number> = {};
          for (const line of result.data.lines) {
            if (line.issue === "QUANTITY_REDUCED" || (line.issue === null && state.reductions[line.variantId] === line.quantity && line.maxQuantity === line.quantity)) reductions[line.variantId] = line.quantity;
          }
          return { quote: result.data, key, loading: false, error: null, reductions };
        });
        // Apply only the quote for this exact request, never an older response.
        for (const line of result.data.lines) if (line.issue === "QUANTITY_REDUCED") useCartStore.getState().setQuantity(line.variantId, line.quantity, line.maxQuantity);
      } catch {
        if (!controller.signal.aborted) useQuoteStore.setState({ loading: false, error: "Chưa tải được giỏ hàng. Vui lòng kiểm tra kết nối và thử lại." });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, hydrated, open, path, refreshId]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") useQuoteStore.getState().refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
}

export function useCartQuote() {
  const state = useQuoteStore();
  const lines = useCartStore((state) => state.lines), code = useCartStore((state) => state.discountCode);
  const ready = state.key === cartRequestKey(lines, code) && !state.loading && !state.error;
  return { ...state, ready, pending: state.loading || (!ready && !state.error) };
}
