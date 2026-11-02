import { notFound } from "next/navigation";
import { idSchema } from "@/lib/validation/common";
import { readAuthorizedPage } from "@/server/auth/guards";
import { getContentService } from "@/server/services/content.service";
import { CollectionEditor } from "@/components/admin/content/collection-editor";
export const metadata = { title: "Sửa bộ sưu tập" };
export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!idSchema.safeParse(id).success) notFound();
  const service = getContentService(), { data } = await readAuthorizedPage("staff", `/admin/collections/${id}`, () => service.listCollections());
  const collection = data.find((item) => item.id === id); if (!collection) notFound();
  const initialProducts = collection.productIds.length ? (await service.productChoices("", collection.productIds)).products : [];
  return <CollectionEditor collection={collection} initialProducts={initialProducts} />;
}
