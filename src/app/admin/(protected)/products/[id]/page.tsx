import { notFound } from "next/navigation";
import { requireRolePage } from "@/server/auth/guards";
import { getProductService } from "@/server/services/product.service";
import { AppError } from "@/server/errors";
import { idSchema } from "@/lib/validation/common";
import { ProductEditor } from "@/components/admin/products/product-editor";
export const metadata = { title: "Chỉnh sửa sản phẩm" };
export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; page?: string }> }) {
  const { id } = await params;
  await requireRolePage("staff", `/admin/products/${id}`);
  if (!idSchema.safeParse(id).success) notFound();
  const query = await searchParams, service = getProductService();
  const product = await service.get(id).catch((error: unknown) => { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; });
  const [options, history] = await Promise.all([service.options(), service.history(id, Number(query.page))]);
  return <ProductEditor product={product} options={options} history={history} initialTab={query.tab === "stock" ? "stock" : "details"} />;
}
