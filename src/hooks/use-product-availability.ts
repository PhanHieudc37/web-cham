"use client";

import { useEffect, useState } from "react";
import type { ActionResult } from "@/lib/result";
import type { ProductAvailabilityDTO } from "@/types/dto";

export function useProductAvailability(productId: string) {
  const [result, setResult] = useState<{ productId: string; data: ProductAvailabilityDTO | null; error: boolean } | null>(null), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let controller: AbortController | undefined;
    let active = true;
    async function read() {
      controller?.abort(); controller = new AbortController();
      const current = controller;
      try {
        const response = await fetch(`/api/products/${productId}/availability`, { cache: "no-store", signal: AbortSignal.any([current.signal, AbortSignal.timeout(10000)]) });
        const result: ActionResult<ProductAvailabilityDTO> = await response.json();
        if (!active || current.signal.aborted) return;
        if (!response.ok || !result.ok) { setResult({ productId, data: null, error: true }); return; }
        setResult({ productId, data: result.data, error: false });
      } catch { if (active && !current.signal.aborted) setResult({ productId, data: null, error: true }); }
    }
    const refresh = () => { if (document.visibilityState === "visible") void read(); };
    void read(); window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { active = false; controller?.abort(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [productId, attempt]);
  // App Router may retain this component when the product changes. Never let
  // the preceding product's response enable purchases on the next product.
  return { data: result?.productId === productId ? result.data : null, error: result?.productId === productId && result.error, retry: () => setAttempt((attempt) => attempt + 1) };
}
