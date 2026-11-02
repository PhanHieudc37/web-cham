"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/result";

export function useOptimisticVisibility<T extends { id: string }>(source: T[], save: (item: T, patch: Partial<T>) => Promise<ActionResult<unknown>>) {
  const [items, update] = useOptimistic(source, (current, change: { id: string; patch: Partial<T> }) => current.map((item) => item.id === change.id ? { ...item, ...change.patch } : item));
  const [pending, startTransition] = useTransition();
  function toggle(item: T, patch: Partial<T>) {
    startTransition(async () => {
      update({ id: item.id, patch });
      try { const result = await save(item, patch); if (!result.ok) toast.error(result.error.message); }
      catch { toast.error("Chưa lưu được. Vui lòng kiểm tra kết nối và thử lại."); }
    });
  }
  return { items, pending, toggle };
}
