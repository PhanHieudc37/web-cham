import { readAuthorizedPage } from "@/server/auth/guards";
import { getProductService } from "@/server/services/product.service";
import { ProductEditor } from "@/components/admin/products/product-editor";
export const metadata = { title: "Thêm sản phẩm" };
export default async function NewProductPage() {
  const { data } = await readAuthorizedPage("staff", "/admin/products/new", () => getProductService().options());
  return <ProductEditor options={data} />;
}
