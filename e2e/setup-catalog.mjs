import { spawnSync } from "node:child_process";
import setupAdmin from "./setup-admin.mjs";
export default function setup() {
  setupAdmin();
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/seed-catalog.ts"], { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) throw new Error(`Không chuẩn bị được catalog E2E: ${result.stderr}`);
}
