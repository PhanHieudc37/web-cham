import { orderFiltersSchema } from "@/lib/order-admin";
import { ERROR_HTTP_STATUS } from "@/lib/result";
import { requireRole } from "@/server/auth/guards";
import { runAction } from "@/server/run-action";
import { getOrderAdminService } from "@/server/services/order-admin.service";

export async function GET(request: Request) {
  const result = await runAction(async () => {
    const filters = orderFiltersSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    await requireRole("admin");
    const iterator = getOrderAdminService().exportCsv(filters);
    const first = await iterator.next(), second = await iterator.next();
    const encoder = new TextEncoder();
    let initial = true;
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          if (initial) { initial = false; if (!first.done) controller.enqueue(encoder.encode(first.value)); if (!second.done) controller.enqueue(encoder.encode(second.value)); else controller.close(); return; }
          const next = await iterator.next();
          if (next.done) controller.close(); else controller.enqueue(encoder.encode(next.value));
        } catch { console.error("[export] Order export failed"); controller.error(new Error("Không thể xuất đơn hàng")); await iterator.return(); }
      },
      async cancel() { await iterator.return(); },
    });
  });
  if (!result.ok) return Response.json(result, { status: ERROR_HTTP_STATUS[result.error.code], headers: { "Cache-Control": "private, no-store" } });
  return new Response(result.data, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="cham-stu-orders.csv"', "Cache-Control": "private, no-store" } });
}
