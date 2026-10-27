import { z } from "zod";

const requiredText = z.string({ error: "Chưa cấu hình biến môi trường" }).trim().min(1, "Không được để trống");
const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);
const webUrl = z.url({ protocol: /^https?$/, error: "Phải là URL http hoặc https hợp lệ" });
const optionalWebUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  webUrl.optional(),
);
const postgresUrl = z.url({ protocol: /^postgres(ql)?$/, error: "Phải là URL PostgreSQL hợp lệ" });
const optionalPostgresUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  postgresUrl.optional(),
);

export const databaseEnvSchema = z.object({ DATABASE_URL: postgresUrl });
export const seedEnvSchema = databaseEnvSchema.extend({
  BETTER_AUTH_SECRET: requiredText.min(32, "Phải có ít nhất 32 ký tự"),
  BETTER_AUTH_URL: webUrl,
  ADMIN_SEED_EMAIL: z.email({ error: "Cần email admin hợp lệ" }),
  ADMIN_SEED_PASSWORD: requiredText.min(8, "Mật khẩu admin phải có ít nhất 8 ký tự"),
});

// This schema contains no process.env access and is safe for Next's config loader.
export const localEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: webUrl,
  BETTER_AUTH_URL: webUrl,
  BETTER_AUTH_SECRET: requiredText.min(32, "Phải có ít nhất 32 ký tự"),
  SUPABASE_STORAGE_BUCKET: z.literal("media", { error: "Bucket phải có tên media" }),
  SUPABASE_URL: optionalWebUrl,
}).refine(
  (values) => values.BETTER_AUTH_URL === values.NEXT_PUBLIC_SITE_URL,
  { path: ["BETTER_AUTH_URL"], error: "Phải bằng NEXT_PUBLIC_SITE_URL" },
);

export const serverEnvSchema = localEnvSchema.safeExtend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: postgresUrl,
  DIRECT_URL: optionalPostgresUrl,
  TEST_DATABASE_URL: optionalPostgresUrl,
  SUPABASE_URL: webUrl,
  SUPABASE_SERVICE_ROLE_KEY: requiredText,
  RESEND_API_KEY: optionalText,
  EMAIL_FROM: optionalText,
  SHOP_NOTIFY_EMAIL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.email({ error: "Phải là địa chỉ email hợp lệ" }).optional(),
  ),
  TELEGRAM_BOT_TOKEN: optionalText,
  TELEGRAM_CHAT_ID: optionalText,
  ADMIN_SEED_EMAIL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.email({ error: "Phải là địa chỉ email hợp lệ" }).optional(),
  ),
  ADMIN_SEED_PASSWORD: optionalText,
}).check((context) => {
  if (context.value.NODE_ENV !== "production") return;
  for (const key of ["RESEND_API_KEY", "EMAIL_FROM", "SHOP_NOTIFY_EMAIL"] as const) {
    if (!context.value[key]) {
      context.issues.push({ code: "custom", input: undefined, path: [key], message: "Bắt buộc khi chạy production" });
    }
  }
});

export function parseEnvironment<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    // Never include input values: connection strings and keys may contain secrets.
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Cấu hình môi trường chưa hợp lệ:\n${details.join("\n")}`);
  }
  return result.data;
}
