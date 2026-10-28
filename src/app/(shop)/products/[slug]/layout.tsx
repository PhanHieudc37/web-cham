import { getProductDetail } from "@/server/services/catalog.service";
import { readCatalogPage } from "../../catalog-boundary";

export default async function ProductLayout({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  // Keep hidden products out of the initial HTTP 200 loading response.
  await readCatalogPage(() => getProductDetail(slug));
  return children;
}
