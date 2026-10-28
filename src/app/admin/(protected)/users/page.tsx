import { requireRolePage } from "@/server/auth/guards";
import { getUserService } from "@/server/services/user.service";
import { UsersView } from "@/components/admin/users/users-view";

export const metadata = { title: "Tài khoản" };
export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const actor = await requireRolePage("admin", "/admin/users");
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const data = await getUserService().list(actor.id, query, Number(params.page));
  return <UsersView {...data} actorId={actor.id} query={query} />;
}
