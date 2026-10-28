import { requireRolePage } from "@/server/auth/guards";
import { getContentService } from "@/server/services/content.service";
import { CollectionsView } from "@/components/admin/content/collections-view";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
export const metadata = { title: "Bộ sưu tập" };
export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) { await requireRolePage("staff", "/admin/collections"); const rows = await getContentService().listCollections(), params = await searchParams; const totalPages = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE)), page = Math.min(totalPages, Math.max(1, Math.floor(Number(params.page)) || 1)); return <CollectionsView collections={rows.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE)} page={page} totalPages={totalPages} total={rows.length} />; }
