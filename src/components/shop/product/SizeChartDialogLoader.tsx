"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
const SizeDialog = dynamic(() => import("./SizeChartDialog").then((module) => module.SizeChartDialog), { ssr: false });
export function SizeChartDialogLoader({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  return loaded ? <SizeDialog>{children}</SizeDialog> : <button type="button" className="mb-3 min-h-8 text-xs underline underline-offset-4" aria-haspopup="dialog" onClick={() => setLoaded(true)}>Hướng dẫn chọn size</button>;
}
