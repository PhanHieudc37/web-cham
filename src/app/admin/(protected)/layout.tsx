import { headers } from "next/headers";
import { requireRolePage } from "@/server/auth/guards";
import { getAdminShellData } from "@/server/services/user.service";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-admin-path") ?? "/admin";
  const person = await requireRolePage("staff", path);
  return <AdminShell {...await getAdminShellData(person)}>{children}</AdminShell>;
}
