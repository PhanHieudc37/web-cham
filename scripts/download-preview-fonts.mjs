import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("preview/fonts", { recursive: true });
const response = await fetch("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap", { headers: { "User-Agent": "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36" }, signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error(`Font stylesheet failed: ${response.status}`);
let css = await response.text();
const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)\s]+/g) ?? [])];
for (const [index, url] of urls.entries()) {
  const download = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!download.ok) throw new Error(`Font download failed: ${download.status}`);
  const name = `be-vietnam-pro-${index}.${url.endsWith(".woff2") ? "woff2" : "ttf"}`;
  writeFileSync(`preview/fonts/${name}`, new Uint8Array(await download.arrayBuffer()));
  css = css.replaceAll(url, `./${name}`);
}
writeFileSync("preview/fonts/fonts.css", css);
const license = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/OFL.txt", { signal: AbortSignal.timeout(30_000) });
if (!license.ok) throw new Error("Font license download failed");
writeFileSync("preview/fonts/OFL.txt", await license.text());
console.log(`Downloaded ${urls.length} font subsets and SIL Open Font License; preview self-hosts fonts.`);
