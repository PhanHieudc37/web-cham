import { setTimeout as delay } from "node:timers/promises";

const origin = new URL(process.env.PUBLIC_SITE_URL || "https://chamstu.netlify.app").origin;
if (!origin.startsWith("https://")) throw new Error("Warm target must use HTTPS");
const expected = process.env.EXPECTED_COMMIT;
if (!/^[a-f0-9]{40}$/i.test(expected ?? "")) throw new Error("Missing deployment commit");
const deadline = Date.now() + 15 * 60 * 1000;
let ready = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(10000), redirect: "error" });
    const health = await response.json();
    if (response.ok && health.ok && health.commit === expected) { ready = true; break; }
  } catch { /* Deployment is not ready yet. */ }
  await delay(30000);
}
if (!ready) throw new Error("Expected deployment was not ready within 15 minutes");
const sitemapResponse = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(10000), redirect: "error" });
if (!sitemapResponse.ok) throw new Error("Cannot load public sitemap");
const sitemap = await sitemapResponse.text();
const paths = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap((match) => {
  try {
    const url = new URL(match[1].replaceAll("&amp;", "&"));
    return url.origin === origin && !/^\/(?:admin|api|cart|checkout|kiem-tra-don-hang)(?:\/|$)/.test(url.pathname) && !url.search ? [url.pathname] : [];
  } catch { return []; }
}))].slice(0, 200);
let passed = 0, failed = 0;
const warmDeadline = Date.now() + 5 * 60 * 1000;
const targets = [...new Set(["/", "/search-index.json", ...paths])].slice(0, 200);
for (const path of targets) {
  if (Date.now() >= warmDeadline) break;
  try {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(10000), redirect: "error" });
    await response.arrayBuffer();
    if (response.ok) passed++; else failed++;
  } catch { failed++; }
  await delay(300);
}
const skipped = targets.length - passed - failed;
console.log(JSON.stringify({ deployment: expected, warmed: passed, failed, skipped, sitemapPaths: paths.length }));
if (failed || skipped) process.exitCode = 1;
