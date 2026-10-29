import { requireRolePage } from "@/server/auth/guards";
import { getOrderAdminService } from "@/server/services/order-admin.service";
import { Dashboard } from "@/components/admin/orders/Dashboard";

export default async function AdminHome() {
  const actor = await requireRolePage("staff");
  return <Dashboard data={await getOrderAdminService().dashboard(actor.role)} name={actor.name} />;
}