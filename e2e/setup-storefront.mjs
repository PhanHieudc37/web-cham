import { spawnSync } from "node:child_process";
import setupContent from "./setup-content.mjs";
export default function setup() {
  setupContent();
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/seed-storefront.ts"], { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) throw new Error(`Không chuẩn bị được storefront E2E: ${result.stderr}`);
}
