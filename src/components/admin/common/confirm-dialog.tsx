"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/result";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function ConfirmDialog({ open, title, description, onClose, onConfirm }: { open: boolean; title: string; description: string; onClose: () => void; onConfirm: () => Promise<ActionResult<unknown>> }) {
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  return <Dialog open={open} onOpenChange={(value) => { if (!value && !pending) { setError(""); onClose(); } }}><DialogContent className="rounded-md"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" className="h-11" onClick={onClose} disabled={pending}>Quay lại</Button><Button className="h-11" disabled={pending} onClick={async () => { setPending(true); const result = await onConfirm(); setPending(false); if (!result.ok) { setError(result.error.message); return; } toast.success("Đã lưu"); setError(""); onClose(); }}>{pending ? "Đang lưu…" : "Xác nhận"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
