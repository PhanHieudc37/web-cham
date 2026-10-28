import { spawnSync } from "node:child_process";
import setupStorefront from "./setup-storefront.mjs";
import { createFixtures } from "./browsing-fixtures.mjs";
export default function setup() {
  setupStorefront();
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/seed-browsing.ts"], { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) throw new Error(`Không chuẩn bị được browsing E2E: ${result.stderr}`);
  createFixtures();
}
