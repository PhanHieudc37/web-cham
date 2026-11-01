import { getSearchIndex } from "@/server/services/catalog.service";

export const dynamic = "force-static";
export const revalidate = 86400;
export async function GET() {
  // Static public asset; only public catalog DTOs, never admin/customer records.
  return Response.json(await getSearchIndex());
}
