import { requireRolePage } from "@/server/auth/guards";
import { CollectionEditor } from "@/components/admin/content/collection-editor";
export const metadata = { title: "Thêm bộ sưu tập" };
export default async function NewCollectionPage() { await requireRolePage("staff", "/admin/collections/new"); return <CollectionEditor />; }
