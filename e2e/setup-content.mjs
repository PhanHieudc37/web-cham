import { spawnSync } from "node:child_process";
import setupCatalog from "./setup-catalog.mjs";
import { createProbe } from "./content-cache-probe.mjs";
export default function setup() {
  setupCatalog();
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/seed-content.ts"], { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) throw new Error(`Không chuẩn bị được content E2E: ${result.stderr}`);
  createProbe();
}
