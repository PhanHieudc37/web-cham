import { z } from "zod";
import { parseEnvironment, serverEnvSchema } from "./env";

const productionSchema = serverEnvSchema.safeExtend({ NODE_ENV: z.literal("production"), DIRECT_URL: z.url(), TEST_DATABASE_URL: z.literal("").optional() }).check((context) => {
  const input = context.value;
  const issue = (key: string, message: string) => context.issues.push({ code: "custom", input: undefined, path: [key], message });
  if (![input.NEXT_PUBLIC_SITE_URL, input.SUPABASE_URL, input.DATABASE_URL, input.DIRECT_URL].every((value) => URL.canParse(value))) return;
  const site = new URL(input.NEXT_PUBLIC_SITE_URL);
  if (site.protocol !== "https:" || site.username || site.password || site.pathname !== "/" || site.search || site.hash || /^(localhost|127\.|\[::1\])/.test(site.hostname)) issue("NEXT_PUBLIC_SITE_URL", "Cần HTTPS tại tên miền production, không có path/query");
  const project = new URL(input.SUPABASE_URL);
  if (project.protocol !== "https:" || !/^[a-z0-9]+\.supabase\.co$/.test(project.hostname)) issue("SUPABASE_URL", "Cần URL project Supabase production");
  const reference = project.hostname.split(".")[0];
  for (const [key, port] of [["DATABASE_URL", "6543"], ["DIRECT_URL", "5432"]] as const) {
    const connection = new URL(input[key]);
    if (!/^postgres(ql)?:$/.test(connection.protocol) || !connection.hostname.endsWith(".pooler.supabase.com") || connection.port !== port || decodeURIComponent(connection.username) !== `postgres.${reference}` || connection.pathname !== "/postgres") issue(key, `Cần pooler cùng project Supabase, cổng ${port}`);
    if (!["require", "verify-full"].includes(connection.searchParams.get("sslmode") ?? "")) issue(key, "Cần sslmode=require hoặc verify-full");
  }
  const sender = input.EMAIL_FROM?.match(/<([^<>]+)>\s*$/)?.[1] ?? input.EMAIL_FROM ?? "";
  if (!z.email().safeParse(sender).success || /@(resend\.dev|.*\.test|example\.[a-z]+)$/i.test(sender)) issue("EMAIL_FROM", "Cần địa chỉ gửi tại domain thật đã xác minh trên Resend");
});

export function parseProductionEnvironment(input: Record<string, string | undefined>, development: Record<string, string | undefined> = {}) {
  const environment = parseEnvironment(productionSchema, { ...input, NODE_ENV: "production", TEST_DATABASE_URL: input.TEST_DATABASE_URL || "" });
  const reference = new URL(environment.SUPABASE_URL).hostname;
  const developmentReferences = [development.SUPABASE_URL].filter((value): value is string => Boolean(value)).map((value) => new URL(value).hostname);
  for (const value of [development.DATABASE_URL, development.DIRECT_URL].filter((value): value is string => Boolean(value))) {
    const connection = new URL(value), username = decodeURIComponent(connection.username);
    if (username.startsWith("postgres.")) developmentReferences.push(`${username.slice("postgres.".length)}.supabase.co`);
  }
  if (developmentReferences.includes(reference)) throw new Error("Production phải là project Supabase riêng, khác .env dev. Không chạy lệnh.");
  return environment;
}

export const adminRecoverySchema = z.object({
  ADMIN_RECOVERY_EMAIL: z.email().transform((value) => value.toLowerCase()),
  ADMIN_RECOVERY_PASSWORD: z.string().min(12).max(128),
});
