import { requireRolePage } from "@/server/auth/guards";

export default async function SettingsPage() {
  await requireRolePage("admin", "/admin/settings");
  return <section className="rounded-md border bg-white p-6"><h1 className="text-2xl font-semibold">Cài đặt cửa hàng</h1><p className="mt-3 text-sm text-stone-500">Phần cài đặt thông tin shop, vận chuyển và thanh toán đang được chuẩn bị.</p></section>;
}
