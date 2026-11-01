import { cartQuoteSchema } from "@/lib/validation/checkout";
import { ERROR_HTTP_STATUS } from "@/lib/result";
import { AppError } from "@/server/errors";
import { runAction } from "@/server/run-action";
import { rateLimit } from "@/server/rate-limit";
import { getClientIp } from "@/server/request";
import { quoteCart } from "@/server/services/cart.service";

export async function POST(request: Request) {
  const result = await runAction(async () => {
    const body: unknown = await request.json().catch(() => { throw new AppError("VALIDATION_ERROR", "Dữ liệu giỏ hàng không hợp lệ."); });
    const { lines } = cartQuoteSchema.parse(body);
    // Public read: no login required. Price and stock always come from the database.
    const ip = await getClientIp();
    const [limit, quote] = await Promise.allSettled([rateLimit(`cart:${ip}`, 60, 60), quoteCart(lines)]);
    // Preserve rate-limit precedence even when the quote fails sooner.
    if (limit.status === "rejected") throw limit.reason;
    if (quote.status === "rejected") throw quote.reason;
    return quote.value;
  });
  return Response.json(result, { status: result.ok ? 200 : ERROR_HTTP_STATUS[result.error.code], headers: { "Cache-Control": "no-store" } });
}
