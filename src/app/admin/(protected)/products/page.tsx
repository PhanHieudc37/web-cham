import { requireRolePage } from "@/server/auth/guards";
import { getProductService } from "@/server/services/product.service";
import { idSchema } from "@/lib/validation/common";
import { ProductsView } from "@/components/admin/products/products-view";
export const metadata = { title: "Sản phẩm" };
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRolePage("staff", "/admin/products");
  const params = await searchParams, text = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const query = text("q").slice(0, 100), category = idSchema.safeParse(text("category")), status = text("status");
  const validStatus = status === "active" || status === "draft" || status === "archived" ? status : undefined;
  const service = getProductService();
  const [data, options] = await Promise.all([service.list({ query, categoryId: category.success ? category.data : undefined, status: validStatus, lowStock: text("low") === "1", page: Number(text("page")) }), service.options()]);
  return <ProductsView {...data} categories={options.categories} filters={{ q: query, category: category.success ? category.data : "", status: validStatus ?? "", lowStock: text("low") === "1" }} />;
}
