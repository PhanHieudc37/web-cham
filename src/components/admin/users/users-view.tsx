"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, LockKeyhole, Plus, Search, ShieldCheck, UserRoundCog, Users } from "lucide-react";
import { toast } from "sonner";
import { roleLabel } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { AdminUserDTO } from "@/types/admin";
import { setUserBanAction, setUserRoleAction } from "@/server/actions/admin/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreateUserForm, ResetUserPassword } from "./user-forms";

export function UsersView({ users, total, page, totalPages, query, actorId }: { users: AdminUserDTO[]; total: number; page: number; totalPages: number; query: string; actorId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false), [resetting, setResetting] = useState<AdminUserDTO | null>(null);
  const [confirmation, setConfirmation] = useState<{ user: AdminUserDTO; operation: "role" | "ban" } | null>(null);
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  const status = (person: AdminUserDTO) => <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${person.banned ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-800"}`}><span className={`size-1.5 rounded-full ${person.banned ? "bg-stone-400" : "bg-emerald-600"}`} />{person.banned ? "Đã khóa" : "Hoạt động"}</span>;
  const controls = (person: AdminUserDTO) => person.id === actorId ? <span className="text-xs text-stone-400">Tài khoản của bạn</span> : <div className="flex flex-wrap items-center justify-start gap-1 lg:justify-end">
    <Button variant="ghost" size="icon" className="size-10" aria-label={`Đổi vai trò ${person.name}`} title="Đổi vai trò" onClick={() => { setError(""); setConfirmation({ user: person, operation: "role" }); }}><UserRoundCog size={16} /></Button>
    <Button variant="ghost" size="icon" className="size-10" aria-label={`${person.banned ? "Mở khóa" : "Khóa"} ${person.name}`} title={person.banned ? "Mở khóa" : "Khóa"} onClick={() => { setError(""); setConfirmation({ user: person, operation: "ban" }); }}><LockKeyhole size={16} /></Button>
    <Button variant="ghost" size="icon" className="size-10" aria-label={`Đặt lại mật khẩu ${person.name}`} title="Đặt lại mật khẩu" onClick={() => setResetting(person)}><KeyRound size={16} /></Button>
  </div>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-medium tracking-[0.18em] text-stone-400">CỬA HÀNG / THÀNH VIÊN</p><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tài khoản quản trị<span className="ml-3 align-middle text-sm font-normal text-stone-400">{total}</span></h1><p className="mt-2 text-sm text-stone-500">Quản lý thành viên và quyền truy cập cửa hàng.</p></div><Button className="h-11 gap-2 px-4" onClick={() => setCreating(true)}><Plus size={16} />Thêm tài khoản</Button></div>
    <div className="flex items-start gap-3 rounded-md border border-stone-200 bg-[#eeeee9] px-4 py-4"><ShieldCheck size={19} strokeWidth={1.6} className="mt-0.5 shrink-0 text-stone-500" /><p className="text-xs leading-6 text-stone-600">Chỉ quản trị viên được cấp quyền và khóa tài khoản. Bạn không thể tự khóa hoặc tự hạ quyền chính mình.</p></div>
    <section className="overflow-hidden rounded-md border bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><form action="/admin/users" method="get" className="relative w-full max-w-sm"><Search size={16} className="absolute top-3.5 left-3 text-stone-400" /><Input name="q" aria-label="Tìm tài khoản" defaultValue={query} placeholder="Tìm theo tên hoặc email…" className="h-11 pr-16 pl-9" /><button className="absolute inset-y-1 right-1 rounded px-3 text-xs text-stone-500 hover:bg-stone-50" type="submit">Tìm</button></form><span className="text-xs text-stone-400">{total} thành viên</span></div>
      {users.length === 0 ? <div className="py-16 text-center"><Users className="mx-auto mb-3 text-stone-300" size={30} /><p className="text-sm text-stone-500">Không tìm thấy tài khoản phù hợp</p>{query && <Link href="/admin/users" className="mt-4 inline-block text-xs underline">Xóa tìm kiếm</Link>}</div> : <>
        <div className="hidden lg:block"><table className="w-full text-left text-sm"><thead className="border-b bg-stone-50 text-[10px] font-medium tracking-wider text-stone-500 uppercase"><tr><th className="px-5 py-4">Thành viên</th><th className="px-4 py-4">Vai trò</th><th className="px-4 py-4">Trạng thái</th><th className="px-4 py-4">Ngày tạo</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{users.map((person) => <tr key={person.id} className="hover:bg-stone-50/50"><td className="max-w-64 px-5 py-5"><div className="font-medium break-words">{person.name}</div><div className="mt-0.5 text-xs break-all text-stone-500">{person.email}</div></td><td className="px-4 py-5 text-xs">{roleLabel(person.role)}</td><td className="px-4 py-5">{status(person)}</td><td className="px-4 py-5 text-xs whitespace-nowrap text-stone-500">{formatDateTime(person.createdAt)}</td><td className="px-5 py-5">{controls(person)}</td></tr>)}</tbody></table></div>
        <div className="divide-y lg:hidden">{users.map((person) => <article key={person.id} className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-sm font-medium break-words">{person.name}</h2><p className="mt-1 text-xs break-all text-stone-500">{person.email}</p></div><div className="shrink-0">{status(person)}</div></div><div className="flex flex-wrap justify-between gap-2 text-xs text-stone-500"><span>{roleLabel(person.role)}</span><time>{formatDateTime(person.createdAt)}</time></div><div className="flex min-h-10 items-center justify-between border-t pt-2"><span className="text-[10px] text-stone-400">QUYỀN TRUY CẬP</span>{controls(person)}</div></article>)}</div>
      </>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 text-xs text-stone-500"><span>Trang {page} / {totalPages}</span><div className="flex gap-2">{page > 1 && <Link className="rounded-md border px-3 py-2 hover:bg-stone-50" href={`/admin/users?q=${encodeURIComponent(query)}&page=${page - 1}`}>Trước</Link>}{page < totalPages && <Link className="rounded-md border px-3 py-2 hover:bg-stone-50" href={`/admin/users?q=${encodeURIComponent(query)}&page=${page + 1}`}>Sau</Link>}</div></div>
    </section>
    <CreateUserForm open={creating} onOpenChange={setCreating} /><ResetUserPassword person={resetting} onClose={() => setResetting(null)} />
    <Dialog open={Boolean(confirmation)} onOpenChange={(value) => { if (!value && !pending) setConfirmation(null); }}><DialogContent className="rounded-md"><DialogHeader><DialogTitle>{confirmation?.operation === "role" ? "Đổi vai trò tài khoản?" : confirmation?.user.banned ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}</DialogTitle><DialogDescription>{confirmation?.operation === "role" ? `${confirmation.user.name} sẽ chuyển thành ${roleLabel(confirmation.user.role === "admin" ? "staff" : "admin").toLowerCase()}.` : `${confirmation?.user.name} sẽ ${confirmation?.user.banned ? "được đăng nhập trở lại" : "không thể đăng nhập"}.`} Các phiên hiện tại sẽ bị thu hồi khi khóa hoặc đổi vai trò.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" className="h-11" disabled={pending} onClick={() => setConfirmation(null)}>Quay lại</Button><Button className="h-11" disabled={pending} onClick={async () => {
        if (!confirmation) return; setPending(true); setError("");
        const result = confirmation.operation === "role" ? await setUserRoleAction({ userId: confirmation.user.id, role: confirmation.user.role === "admin" ? "staff" : "admin" }) : await setUserBanAction({ userId: confirmation.user.id, banned: !confirmation.user.banned });
        setPending(false); if (!result.ok) { setError(result.error.message); return; } toast.success("Đã lưu"); setConfirmation(null); router.refresh();
      }}>{pending ? "Đang lưu…" : "Xác nhận"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
