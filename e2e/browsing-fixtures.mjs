import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const images = path.resolve(workspace, "public/images/phase7-tests");
const route = path.resolve(workspace, "src/app/(shop)/phase7-error-probe");
function assertOwned(directory) { if (!directory.startsWith(`${path.resolve(workspace)}${path.sep}`)) throw new Error("Fixture path outside workspace"); }
export function createFixtures() {
  assertOwned(images); assertOwned(route);
  mkdirSync(images, { recursive: true });
  for (const [name, color] of [["black", "#111111"], ["white", "#ffffff"], ["detail", "#b8ad9c"]]) {
    writeFileSync(path.join(images, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" fill="#f5f3f0"/><path d="M270 180L190 230L120 360L230 410L265 350V650H535V350L570 410L680 360L610 230L530 180Q400 250 270 180Z" fill="${color}" stroke="#999" stroke-width="3"/><path d="M340 200Q400 300 460 200" fill="none" stroke="#999" stroke-width="4"/></svg>`);
  }
  mkdirSync(route, { recursive: true });
  writeFileSync(path.join(route, "page.tsx"), `import { headers } from "next/headers";
import { notFound } from "next/navigation";
export default async function Probe() {
  const input = await headers();
  if (process.env.CONTENT_CACHE_PROBE !== "1" || process.env.NODE_ENV === "production" || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !new URL(process.env.DATABASE_URL ?? "").pathname.endsWith("_test") || input.get("x-phase7-error") !== "1") notFound();
  if (input.get("x-phase7-fail") === "1") throw new Error("Temporary browsing test error");
  return <h1>Đã khôi phục trang kiểm thử</h1>;
}
`);
}
export function removeFixtures() {
  assertOwned(images); assertOwned(route);
  for (const name of ["black.svg", "white.svg", "detail.svg"]) { const file = path.join(images, name); if (existsSync(file)) unlinkSync(file); }
  if (existsSync(images)) rmdirSync(images);
  const page = path.join(route, "page.tsx"); if (existsSync(page)) unlinkSync(page);
  if (existsSync(route)) rmdirSync(route);
}
