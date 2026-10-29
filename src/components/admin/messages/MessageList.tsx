"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import type { ContactListDTO } from "@/types/contact";
import { markContactHandledAction } from "@/server/actions/admin/contacts";
import { Button } from "@/components/ui/button";

export function MessageList({ data, status }: { data: ContactListDTO; status: "new" | "handled" }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  return <div className="space-y-6"><header><p className="mb-2 text-[10px] tracking-widest text-stone-400">CHĂM SÓC KHÁCH HÀNG</p><h1 className="text-2xl font-semibold">Tin nhắn liên hệ</h1></header><nav aria-label="Trạng thái tin nhắn" className="flex gap-2">{(["new", "handled"] as const).map((value) => <Link key={value} href={`/admin/messages?status=${value}`} aria-current={status === value ? "page" : undefined} className={`rounded-md border px-4 py-3 text-sm ${status === value ? "border-stone-900 bg-stone-900 text-white" : "bg-white"}`}>{value === "new" ? "Mới" : "Đã xử lý"} <span className="ml-1 opacity-70">{data.counts[value]}</span></Link>)}</nav>
    <div className="space-y-4">{data.items.map((message) => <article key={message.id} className="min-w-0 space-y-4 rounded-md border bg-white p-4 md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold break-words">{message.name}</h2><p className="mt-2 text-xs text-stone-500">{formatDateTime(message.createdAt)}</p></div>{message.status === "new" && <Button className="h-11 text-xs" disabled={pending !== null} onClick={async () => { setPending(message.id); try { const result = await markContactHandledAction({ id: message.id }); if (!result.ok) { toast.error(result.error.message); return; } toast.success("Đã lưu"); router.refresh(); } catch { toast.error("Chưa lưu được. Vui lòng thử lại."); } finally { setPending(null); } }}>{pending === message.id ? "Đang lưu…" : "Đánh dấu đã xử lý"}</Button>}</div><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"><span>{message.phone}</span><a className="py-2 text-xs underline" href={`tel:${message.phone}`}>Gọi</a><a className="py-2 text-xs underline" target="_blank" rel="noreferrer" href={`https://zalo.me/${message.phone}`}>Zalo</a>{message.email && <a className="max-w-full break-all text-xs underline" href={`mailto:${message.email}`}>{message.email}</a>}</div><p className="border-t pt-4 text-sm leading-7 break-words whitespace-pre-wrap">{message.message}</p>{message.handledAt && <p className="text-xs leading-6 text-stone-500">Đã xử lý: {formatDateTime(message.handledAt)} · {message.handledByName ?? "Tài khoản đã xóa"}</p>}</article>)}</div>
    {!data.items.length && <p className="rounded-md border bg-white p-8 text-center text-sm text-stone-500">{status === "new" ? "Không có tin nhắn mới." : "Chưa có tin nhắn đã xử lý."}</p>}
    <nav aria-label="Phân trang tin nhắn" className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500"><p>{data.total} tin nhắn · Trang {data.page} / {data.totalPages}</p><div className="flex gap-4">{data.page > 1 && <Link className="py-3" href={`/admin/messages?status=${status}&page=${data.page - 1}`}>Trước</Link>}{data.page < data.totalPages && <Link className="py-3" href={`/admin/messages?status=${status}&page=${data.page + 1}`}>Sau</Link>}</div></nav>
  </div>;
}
