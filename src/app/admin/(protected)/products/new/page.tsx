import { requireRolePage } from "@/server/auth/guards";
import { getProductService } from "@/server/services/product.service";
import { ProductEditor } from "@/components/admin/products/product-editor";
export const metadata = { title: "Thêm sản phẩm" };
export default async function NewProductPage() {
  await requireRolePage("staff", "/admin/products/new");
  return <ProductEditor options={await getProductService().options()} />;
}
