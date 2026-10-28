"use client";

import { useId, useState } from "react";
import { UploadCloud } from "lucide-react";
import { z } from "zod";
import { resizeImage } from "@/lib/image/resize";
import type { MediaReference } from "@/lib/validation/media";

const responseSchema = z.object({ ok: z.literal(true), data: z.object({ url: z.string(), path: z.string() }) });
function upload(file: File, folder: string, progress: (value: number) => void): Promise<MediaReference> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest(); request.open("POST", "/api/admin/upload");
    request.upload.onprogress = (event) => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)); };
    request.onerror = () => reject(new Error("Mất kết nối khi tải ảnh"));
    request.onload = () => {
      let body: unknown;
      try { body = JSON.parse(request.responseText); } catch { reject(new Error("Không tải được ảnh")); return; }
      const parsed = responseSchema.safeParse(body);
      if (request.status === 200 && parsed.success) resolve(parsed.data.data);
      else { const error = z.object({ error: z.object({ message: z.string() }) }).safeParse(body); reject(new Error(error.success ? error.data.error.message : "Không tải được ảnh")); }
    };
    const form = new FormData(); form.set("folder", folder); form.set("file", file); request.send(form);
  });
}
export function ImageUploader({ folder, mode, remaining = 1, onUploaded, onBusyChange }: { folder: "products" | "categories"; mode: "square" | "fit"; remaining?: number; onUploaded: (image: MediaReference) => void; onBusyChange?: (busy: boolean) => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [error, setError] = useState("");
  async function process(files: File[]) {
    if (busy || !files.length) return;
    if (files.length > remaining) { setError(`Chỉ thêm tối đa ${remaining} ảnh nữa`); return; }
    setBusy(true); onBusyChange?.(true); setError("");
    try { for (const file of files) { setProgress(0); const resized = await resizeImage(file, mode); const result = await upload(resized, folder, setProgress); onUploaded(result); } }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Không xử lý được ảnh"); }
    finally { setBusy(false); onBusyChange?.(false); }
  }
  return <div>
    <label htmlFor={id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void process(Array.from(event.dataTransfer.files)); }} className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-stone-50 p-5 text-center ${busy || remaining <= 0 ? "pointer-events-none opacity-50" : "hover:border-stone-500"}`}>
      <UploadCloud size={23} strokeWidth={1.5} className="mb-2 text-stone-400" /><span className="text-sm font-medium">{busy ? `Đang tải ảnh… ${progress}%` : "Chọn hoặc kéo ảnh vào đây"}</span><span className="mt-1 text-xs text-stone-500">WebP, JPEG, PNG · {mode === "square" ? "Khung vuông, giữ trọn ảnh" : "Giữ tỉ lệ ảnh gốc"}</span>
      <input id={id} aria-label={folder === "products" ? "Tải ảnh sản phẩm" : "Tải ảnh danh mục"} type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" multiple={remaining > 1} disabled={busy || remaining <= 0} onChange={(event) => { void process(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      {busy && <progress value={progress} max={100} aria-label="Tiến trình tải ảnh" className="mt-3 h-1 w-full accent-stone-900" />}
    </label>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </div>;
}
