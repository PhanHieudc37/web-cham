import { requireRolePage } from "@/server/auth/guards";
import { getCategoryService } from "@/server/services/category.service";
import { CategoriesView } from "@/components/admin/categories/categories-view";
export const metadata = { title: "Danh mục" };
export default async function CategoriesPage() {
  await requireRolePage("staff", "/admin/categories");
  return <CategoriesView categories={await getCategoryService().list()} />;
}
