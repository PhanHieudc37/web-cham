"use client";
import { useState } from "react";
import type { MediaReference } from "@/lib/validation/media";
import { Button } from "@/components/ui/button";
import { AdminImage } from "./admin-image";
import { ImageUploader } from "./image-uploader";

export function MediaField({ label, url, folder = "banners", onChange, onBusyChange, ratio }: { label: string; url: string | null; folder?: "banners" | "settings"; onChange: (image: MediaReference | null) => void; onBusyChange: (busy: boolean) => void; ratio?: number }) {
  const [warning, setWarning] = useState("");
  return <div className="space-y-3"><p className="text-sm font-medium">{label}</p>{url && <div className="rounded-md border bg-stone-50 p-3"><AdminImage key={url} src={url} alt={label} className="max-h-52 w-full" /><Button type="button" variant="ghost" className="mt-2 h-9 px-2 text-xs" onClick={() => { onChange(null); setWarning(""); }}>Gỡ {label.toLowerCase()}</Button></div>}
    <ImageUploader folder={folder} mode="fit" label={`Tải ${label.toLowerCase()}`} onBusyChange={onBusyChange} onUploaded={(image) => {
      onChange(image); if (ratio) { const element = new window.Image(); element.onload = () => setWarning(Math.abs(element.naturalWidth / element.naturalHeight - ratio) / ratio > 0.2 ? `Ảnh đang lệch tỉ lệ gợi ý ${ratio > 1 ? "ngang" : "dọc"}. Hãy kiểm tra phần xem trước.` : ""); element.src = image.url; }
    }} />{warning && <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">{warning}</p>}
  </div>;
}
