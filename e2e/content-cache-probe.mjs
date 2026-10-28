import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const directory = fileURLToPath(new URL("../src/app/api/phase5-cache-probe/", import.meta.url));
const file = `${directory}route.ts`;
export function createProbe() {
  if (existsSync(file)) throw new Error("Temporary cache probe already exists; run content teardown before retrying");
  mkdirSync(directory, { recursive: true });
  writeFileSync(file, `import { z } from "zod";
import { requireRole } from "@/server/auth/guards";
import { getPublicSettings } from "@/server/services/settings.service";
import { getHome, getMenu, getListing } from "@/server/services/catalog.service";
import { invalidate, CACHE_TAGS } from "@/server/cache";
export async function GET(request: Request) {
  if (process.env.CONTENT_CACHE_PROBE !== "1" || process.env.NODE_ENV === "production" || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !new URL(process.env.DATABASE_URL ?? "").pathname.endsWith("_test")) return new Response(null, { status: 404 });
  const query = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).max(100).nullable(), reset: z.enum(["1"]).nullable() }).parse({ slug: new URL(request.url).searchParams.get("slug"), reset: new URL(request.url).searchParams.get("reset") });
  await requireRole("staff");
  if (query.reset) invalidate(...Object.values(CACHE_TAGS));
  const [settings, home, menu, listing] = await Promise.all([getPublicSettings(), getHome(), getMenu(), query.slug ? getListing(query.slug) : Promise.resolve(null)]);
  return Response.json({ shop: settings.shop, shipping: settings.shipping, announcements: settings.announcements, policies: settings.policies, returnPolicySummary: settings.returnPolicySummary, bankTransferEnabled: settings.bankTransferEnabled, banners: home.banners.map(({ title, href, ctaLabel }) => ({ title, href, ctaLabel })), menu: menu.collections, listing: listing?.products.map(({ name }) => name) }, { headers: { "cache-control": "no-store" } });
}
`);
}
export function removeProbe() { if (existsSync(file)) unlinkSync(file); if (existsSync(directory)) rmdirSync(directory); }
