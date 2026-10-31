import { headers } from "next/headers";
import { requireRolePage } from "@/server/auth/guards";
import { getAdminShellData } from "@/server/services/user.service";
import { getServerEnv } from "@/server/env";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-admin-path") ?? "/admin";
  const person = await requireRolePage("staff", path);
  return <AdminShell {...await getAdminShellData(person)}>{getServerEnv().EMAIL_DELIVERY === "disabled" && <p role="note" className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Email tự động đang tắt. Hãy kiểm tra đơn hàng và tin nhắn mới trong trang quản trị; liên hệ khách qua điện thoại hoặc Zalo.</p>}{children}</AdminShell>;
}
