"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, ChartNoAxesCombined, ChevronDown, CircleUserRound, Images, LayoutGrid, LayoutList, LogOut, Menu, MessageSquare, Package, Settings, ShoppingBag, Tags, Users, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { roleLabel, type SessionUserDTO } from "@/lib/auth";
import { signOutAction } from "@/server/actions/admin/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChangePassword } from "../change-password";

const navigation = [
  { href: "/admin", label: "Tổng quan", icon: LayoutGrid, ready: true },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag, ready: false },
  { href: "/admin/products", label: "Sản phẩm", icon: Package, ready: true },
  { href: "/admin/categories", label: "Danh mục", icon: LayoutList, ready: true },
  { href: "/admin/collections", label: "Bộ sưu tập", icon: Tags, ready: true },
  { href: "/admin/banners", label: "Banner", icon: Images, ready: true },
  { href: "/admin/messages", label: "Tin nhắn", icon: MessageSquare, ready: false },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings, admin: true, ready: true },
  { href: "/admin/users", label: "Tài khoản", icon: Users, admin: true, ready: true },
];
export function AdminShell({ person, pendingOrders, newMessages, children }: { person: SessionUserDTO; pendingOrders: number; newMessages: number; children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false), [passwordOpen, setPasswordOpen] = useState(false), [leaving, setLeaving] = useState(false);
  const title = navigation.find((item) => item.href === path || (item.href !== "/admin" && path.startsWith(`${item.href}/`)))?.label ?? "Quản trị";
  const sidebar = <div className="flex h-full flex-col">
    <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex h-24 items-center gap-3 px-6"><span className="flex size-10 items-center justify-center rounded-md bg-stone-900 text-lg font-semibold text-white">c.</span><span><span className="block text-lg font-semibold tracking-tight">Cham.stu</span><span className="text-[10px] font-medium tracking-[0.18em] text-stone-500">TRANG QUẢN TRỊ</span></span></Link>
    <div className="px-6 pt-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-stone-400">QUẢN LÝ CỬA HÀNG</div>
    <nav aria-label="Quản trị" className="space-y-1 px-3">{navigation.filter((item) => !item.admin || person.role === "admin").map((item) => {
      const Icon = item.icon, badge = item.href === "/admin/orders" ? pendingOrders : item.href === "/admin/messages" ? newMessages : 0;
      const content = <><Icon size={18} strokeWidth={1.7} /><span className="flex-1">{item.label}</span>{badge > 0 ? <span className="rounded-full bg-stone-200 px-2 text-xs text-stone-700">{badge}</span> : !item.ready && <span className="text-[10px] text-stone-400">Sắp có</span>}</>;
      return item.ready ? <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={path === item.href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm ${path === item.href ? "bg-stone-900 font-medium text-white" : "text-stone-600 hover:bg-stone-100"}`}>{content}</Link>
        : <div key={item.href} aria-disabled="true" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-stone-400">{content}</div>;
    })}</nav>
    <div className="mt-auto p-5"><div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-500"><span className="mb-1 flex items-center gap-2 font-medium text-stone-800"><span className="size-1.5 rounded-full bg-emerald-600" />Không gian làm việc</span>Quản lý shop từ máy tính và điện thoại.</div></div>
  </div>;
  return <div className="admin-theme min-h-dvh bg-[#f7f7f6] text-stone-900">
    <a className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:p-3" href="#admin-content">Đến nội dung chính</a>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-white lg:block">{sidebar}</aside>
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetContent side="left" className="w-[280px] gap-0 p-0"><SheetHeader className="sr-only"><SheetTitle>Menu quản trị</SheetTitle><SheetDescription>Điều hướng các chức năng cửa hàng.</SheetDescription></SheetHeader>{sidebar}</SheetContent></Sheet>
    <div className="min-w-0 lg:pl-60">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-2 border-b bg-white px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3"><Button size="icon" variant="ghost" className="size-11 lg:hidden" aria-label="Mở menu quản trị" onClick={() => setMenuOpen(true)}><Menu size={21} /></Button><span className="truncate text-sm font-medium">{title}</span></div>
        <div className="flex shrink-0 items-center gap-2 md:gap-5"><Link href="/" target="_blank" className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900"><span className="hidden sm:inline">Xem cửa hàng</span><ArrowUpRight size={17} /><span className="sr-only sm:hidden">Xem cửa hàng</span></Link><span className="h-7 w-px bg-stone-200" />
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-auto min-h-11 gap-2 px-1.5" aria-label="Menu tài khoản"><span className="flex size-8 items-center justify-center rounded-full bg-stone-100"><CircleUserRound size={19} strokeWidth={1.5} /></span><span className="hidden max-w-40 text-left md:block"><span className="block truncate text-xs font-medium">{person.name}</span><span className="block text-[10px] font-normal text-stone-500">{roleLabel(person.role)}</span></span><ChevronDown size={13} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60"><DropdownMenuLabel className="break-words">{person.name}<span className="block text-xs font-normal text-muted-foreground">{roleLabel(person.role)}</span></DropdownMenuLabel><DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setPasswordOpen(true)}><KeyRound />Đổi mật khẩu</DropdownMenuItem><DropdownMenuItem disabled={leaving} onSelect={async () => { setLeaving(true); const result = await signOutAction({}); if (!result.ok) { toast.error(result.error.message); setLeaving(false); return; } router.replace("/admin/login"); router.refresh(); }}><LogOut />{leaving ? "Đang đăng xuất…" : "Đăng xuất"}</DropdownMenuItem>
            </DropdownMenuContent></DropdownMenu>
        </div>
      </header>
      <main id="admin-content" className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-9">{children}</main>
      <footer className="flex flex-wrap justify-between gap-2 px-4 py-6 text-[10px] text-stone-400 md:px-8"><span>© {new Date().getFullYear()} Cham.stu</span><span className="flex items-center gap-1.5"><ChartNoAxesCombined size={12} />Không gian quản trị cửa hàng</span></footer>
    </div><ChangePassword open={passwordOpen} onOpenChange={setPasswordOpen} />
  </div>;
}
