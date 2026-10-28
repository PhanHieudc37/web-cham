import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireRolePage } from "@/server/auth/guards";

export default async function ForbiddenPage() {
  await requireRolePage("staff");
  return <section className="mx-auto max-w-lg rounded-md border bg-white p-8 text-center"><ShieldAlert className="mx-auto mb-5 text-stone-400" size={32} /><p className="text-xs text-stone-400">403 · GIỚI HẠN TRUY CẬP</p><h1 className="mt-2 text-xl font-semibold">Bạn không có quyền truy cập</h1><p className="mt-3 text-sm text-stone-500">Chức năng này chỉ dành cho quản trị viên của shop.</p><Link href="/admin" className="mt-6 inline-block rounded-md bg-stone-900 px-5 py-3 text-sm text-white">Về trang quản trị</Link></section>;
}
