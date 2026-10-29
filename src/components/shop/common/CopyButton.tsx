"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false), [failed, setFailed] = useState(false);
  return <span className="inline-flex max-w-full items-center gap-2"><button type="button" aria-label={`Sao chép ${label}`} onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setFailed(false); } catch { setFailed(true); } }} className="inline-flex min-h-10 shrink-0 items-center gap-2 px-2 text-xs underline underline-offset-4">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Đã sao chép" : "Sao chép"}</button>{failed && <span role="status" className="text-xs text-sale">Vui lòng chọn và sao chép nội dung thủ công.</span>}</span>;
}
