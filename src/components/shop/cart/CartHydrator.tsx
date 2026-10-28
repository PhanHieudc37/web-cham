"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { useCartQuoteController } from "@/hooks/use-cart-quote";

export function CartHydrator() {
  useEffect(() => {
    void Promise.resolve(useCartStore.persist.rehydrate()).finally(() => useCartStore.setState({ hasHydrated: true }));
    const synchronize = (event: StorageEvent) => {
      if (event.key === "cham-cart-v1" || event.key === null) void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);
  useCartQuoteController();
  return null;
}
