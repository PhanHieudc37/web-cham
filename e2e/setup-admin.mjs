import { spawnSync } from "node:child_process";
export default function setup() {
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/seed-admin.ts"], { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) throw new Error(`Không chuẩn bị được database E2E: ${result.stderr}`);
}
