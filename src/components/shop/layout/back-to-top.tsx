"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ArrowUp } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}
export function BackToTop() {
  const visible = useSyncExternalStore(subscribe, () => window.scrollY > 600, () => false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const update = () => { document.getElementById("shop-header")?.toggleAttribute("data-scrolled", window.scrollY > 10); };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  if (!visible) return null;
  return <button type="button" className="flex size-12 items-center justify-center rounded-full border bg-white shadow-sm" aria-label="Về đầu trang" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" })}><ArrowUp size={18} /></button>;
}
