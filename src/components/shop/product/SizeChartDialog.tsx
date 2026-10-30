"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export function SizeChartDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button type="button" className="mb-3 min-h-8 text-xs underline underline-offset-4">Hướng dẫn chọn size</button></DialogTrigger><DialogContent className="shop-dialog max-h-[85dvh] overflow-y-auto rounded-none p-6 sm:max-w-2xl"><DialogTitle className="pr-6 text-lg font-semibold uppercase tracking-wider">Hướng dẫn chọn size</DialogTitle><DialogDescription>Tham khảo số đo của sản phẩm để chọn kích thước phù hợp.</DialogDescription>{children}</DialogContent></Dialog>;
}
