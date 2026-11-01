import { SearchPageView } from "@/components/shop/search/SearchPageView";
import { getListing } from "@/server/services/catalog.service";
import { getPageMetadata } from "@/server/services/seo.service";
export const revalidate = 86400;
export async function generateMetadata() { return getPageMetadata({ title: "Tìm kiếm sản phẩm", path: "/search", noindex: true }); }
export default async function SearchPage() {
  const suggested = (await getListing("best-seller")).products.slice(0, 4);
  return <SearchPageView suggested={suggested} />;
}
