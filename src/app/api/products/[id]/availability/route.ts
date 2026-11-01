import { idSchema } from "@/lib/validation/common";
import { ERROR_HTTP_STATUS } from "@/lib/result";
import { runAction } from "@/server/run-action";
import { getProductAvailability } from "@/server/services/availability.service";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await runAction(async () => {
    const id = idSchema.parse((await params).id);
    // Public read; service applies active product/category visibility in the same query.
    return getProductAvailability(id);
  });
  return Response.json(result, { status: result.ok ? 200 : ERROR_HTTP_STATUS[result.error.code], headers: { "Cache-Control": "no-store" } });
}
