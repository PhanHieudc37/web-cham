import { requireRolePage } from "@/server/auth/guards";
import { getContentService } from "@/server/services/content.service";
import { BannersView } from "@/components/admin/content/banners-view";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
export const metadata = { title: "Banner" };
export default async function BannersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) { await requireRolePage("staff", "/admin/banners"); const rows = await getContentService().listBanners(), params = await searchParams; const totalPages = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE)), page = Math.min(totalPages, Math.max(1, Math.floor(Number(params.page)) || 1)); return <BannersView banners={rows.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE)} page={page} totalPages={totalPages} total={rows.length} />; }
