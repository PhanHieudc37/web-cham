import { readAuthorizedPage } from "@/server/auth/guards";
import { getCategoryService } from "@/server/services/category.service";
import { CategoriesView } from "@/components/admin/categories/categories-view";
export const metadata = { title: "Danh mục" };
export default async function CategoriesPage() {
  const { data } = await readAuthorizedPage("staff", "/admin/categories", () => getCategoryService().list());
  return <CategoriesView categories={data} />;
}
