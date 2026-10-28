import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { safeAdminNext } from "@/lib/auth";
import { getSessionUser } from "@/server/auth/guards";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Đăng nhập" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect("/admin");
  const { next } = await searchParams;
  return <main className="admin-theme grid min-h-dvh bg-[#f7f7f6] lg:grid-cols-2">
    <section className="relative hidden flex-col justify-between overflow-hidden bg-[#e8e5df] p-12 lg:flex xl:p-16"><span className="text-2xl font-semibold tracking-tight">Cham.stu<span className="text-stone-500"> / quản trị</span></span>
      <div className="relative z-10"><p className="mb-6 text-[11px] font-medium tracking-[0.24em] text-stone-500">PHÍA SAU MỖI ĐƠN HÀNG</p><h1 className="max-w-md text-5xl leading-[1.25] font-medium tracking-tight">Một góc nhỏ.<br />Cả cửa hàng.</h1><p className="mt-6 max-w-xs text-sm leading-7 text-stone-600">Chăm chút sản phẩm, kết nối khách hàng và quản lý công việc mỗi ngày.</p></div>
      <div className="flex items-center justify-between border-t border-stone-400/25 pt-5 text-[11px] text-stone-500"><span>CHAM.STU — KHÔNG GIAN LÀM VIỆC</span><span>01 / ADMIN</span></div><div aria-hidden="true" className="absolute -right-32 bottom-24 size-[440px] rounded-full border border-stone-400/20" /><div aria-hidden="true" className="absolute -right-20 bottom-36 size-[350px] rounded-full border border-stone-400/15" /></section>
    <section className="flex min-w-0 flex-col px-6 py-8 sm:px-12 lg:px-16"><Link href="/" className="flex w-fit items-center gap-2 text-xs text-stone-500"><ArrowLeft size={14} />Về cửa hàng</Link>
      <div className="mx-auto my-auto w-full max-w-[360px] py-12"><div className="mb-9 flex size-11 items-center justify-center rounded-md border bg-white"><LockKeyhole size={20} strokeWidth={1.5} /></div><p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-stone-500">CHAM.STU ADMIN</p><h2 className="text-3xl font-semibold tracking-tight">Chào mừng trở lại.</h2><p className="mt-3 mb-8 text-sm text-stone-500">Đăng nhập để bắt đầu quản lý cửa hàng.</p><LoginForm next={safeAdminNext(next)} /></div>
      <p className="text-center text-[10px] text-stone-400">Chỉ dành cho quản trị viên và nhân viên Cham.stu.</p>
    </section>
  </main>;
}
