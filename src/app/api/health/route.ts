import { z } from "zod";
import { readHealth } from "@/server/services/health.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const querySchema = z.object({ db: z.literal("1").optional() }).strict();
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse(Object.fromEntries(parameters));
  const commit = process.env.APP_COMMIT_REF ?? "unknown";
  // Operational probe has the explicit Phase 15A contract, without app/customer DTOs.
  if (!parsed.success || parameters.getAll("db").length > 1) return Response.json({ ok: false, commit, dbMs: null }, { status: 400, headers });
  try {
    // Public read: no authentication, rate-limit writes or shared response cache.
    return Response.json({ ok: true, commit, ...await readHealth(parsed.data.db === "1") }, { headers });
  } catch {
    return Response.json({ ok: false, commit, dbMs: null }, { status: 503, headers });
  }
}
