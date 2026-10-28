import { getListing } from "@/server/services/catalog.service";
import { readCatalogPage } from "../../catalog-boundary";

export default async function CollectionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Validate above loading.tsx so an unknown collection can return HTTP 404.
  await readCatalogPage(() => getListing(slug));
  return children;
}
