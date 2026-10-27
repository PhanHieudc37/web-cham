import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";
import { parseEnvironment } from "./src/lib/validation/env";

config({ path: ".env", quiet: true });
const needsConnection = process.argv.some((argument) => argument === "migrate" || argument === "studio");
const connection = needsConnection || process.env.DIRECT_URL
  ? parseEnvironment(z.object({ DIRECT_URL: z.url({ protocol: /^postgres(ql)?$/, error: "Cần DIRECT_URL PostgreSQL hợp lệ để migrate/studio" }) }), process.env)
  : undefined;

export default defineConfig({
  dialect: "postgresql",
  casing: "snake_case",
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dbCredentials: connection ? { url: connection.DIRECT_URL } : undefined,
  strict: true,
});
