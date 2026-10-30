import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import { adminRecoverySchema, parseProductionEnvironment } from "../src/lib/validation/production";
import { parseEnvironment, seedEnvSchema, serverEnvSchema } from "../src/lib/validation/env";

const commands: Record<string, string[]> = {
  check: ["--conditions=react-server", "--import=tsx", "scripts/check-production.ts"],
  migrate: ["--conditions=react-server", "node_modules/drizzle-kit/bin.cjs", "migrate"],
  seed: ["--conditions=react-server", "--import=tsx", "src/server/db/seed.ts"],
  recover: ["--conditions=react-server", "--import=tsx", "scripts/recover-admin.ts"],
};
try {
  const command = process.argv[2];
  if (!Object.hasOwn(commands, command ?? "") || process.argv.length !== 3) throw new Error("Chỉ dùng production:check, production:migrate, production:seed hoặc admin:recover; không nhận --sample.");
  if (!existsSync(".env.deploy.local")) throw new Error("Chưa có .env.deploy.local. Tạo file riêng theo docs/DEPLOYMENT.md; không dùng .env dev.");
  const production = parse(readFileSync(".env.deploy.local"));
  const development = existsSync(".env") ? parse(readFileSync(".env")) : {};
  const values = parseProductionEnvironment(production, development);
  if (command === "seed") parseEnvironment(seedEnvSchema, production);
  if (command === "recover") parseEnvironment(adminRecoverySchema, production);
  const environment: NodeJS.ProcessEnv = { ...process.env };
  // Explicit empty values prevent dotenv in child commands from falling back to dev.
  for (const key of Object.keys(serverEnvSchema.shape)) environment[key] = production[key] ?? "";
  Object.assign(environment, values, { ADMIN_RECOVERY_EMAIL: command === "recover" ? production.ADMIN_RECOVERY_EMAIL ?? "" : "", ADMIN_RECOVERY_PASSWORD: command === "recover" ? production.ADMIN_RECOVERY_PASSWORD ?? "" : "" });
  if (command !== "seed") environment.ADMIN_SEED_PASSWORD = "";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, commands[command], { env: environment, stdio: "inherit", windowsHide: true });
    child.on("error", () => reject(new Error("Không khởi động được lệnh production.")));
    child.on("exit", (code) => { process.exitCode = code ?? 1; resolve(); });
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : "Không thể chạy lệnh production.");
  process.exitCode = 1;
}
