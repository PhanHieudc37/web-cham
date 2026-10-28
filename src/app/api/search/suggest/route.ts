import { searchSuggestSchema } from "@/lib/validation/search";
import { ERROR_HTTP_STATUS } from "@/lib/result";
import { runAction } from "@/server/run-action";
import { rateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/request";
import { searchProducts } from "@/server/services/catalog.service";

export async function GET(request: Request) {
  const result = await runAction(async () => {
    const { q } = searchSuggestSchema.parse({ q: new URL(request.url).searchParams.get("q") });
    // Public endpoint: no session required; protect the database by IP.
    await rateLimit(`search:${await getClientIp()}`, 60, 60);
    return (await searchProducts(q)).products.slice(0, 6);
  });
  return Response.json(result, { status: result.ok ? 200 : ERROR_HTTP_STATUS[result.error.code],
    headers: { "Cache-Control": result.ok ? "public, s-maxage=60" : "no-store" } });
}
