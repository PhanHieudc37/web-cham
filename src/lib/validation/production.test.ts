import { describe, expect, it } from "vitest";
import { parseProductionEnvironment } from "./production";

const valid = {
  NEXT_PUBLIC_SITE_URL: "https://shop.example.com", BETTER_AUTH_URL: "https://shop.example.com", BETTER_AUTH_SECRET: "test-production-secret-more-than-32-characters",
  DATABASE_URL: "postgresql://postgres.prodproject:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require",
  DIRECT_URL: "postgresql://postgres.prodproject:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require",
  SUPABASE_URL: "https://prodproject.supabase.co", SUPABASE_STORAGE_BUCKET: "media", SUPABASE_SERVICE_ROLE_KEY: "test-only-private-key",
  RESEND_API_KEY: "test-only-email-key", EMAIL_FROM: "Cham.stu <orders@shop.example.com>", SHOP_NOTIFY_EMAIL: "owner@example.com",
};
describe("production isolation", () => {
  it("accepts a dedicated HTTPS production project and does not require seed secrets", () => {
    expect(parseProductionEnvironment(valid, { SUPABASE_URL: "https://devproject.supabase.co" })).toMatchObject({ NODE_ENV: "production", TEST_DATABASE_URL: "" });
  });
  it("rejects local auth/site URLs and mismatched auth origins", () => {
    for (const overrides of [{ NEXT_PUBLIC_SITE_URL: "http://localhost:3000", BETTER_AUTH_URL: "http://localhost:3000" }, { BETTER_AUTH_URL: "https://different.example.com" }]) expect(() => parseProductionEnvironment({ ...valid, ...overrides })).toThrow();
  });
  it("rejects swapped poolers, missing TLS and a different Storage project", () => {
    for (const overrides of [{ DATABASE_URL: valid.DIRECT_URL }, { DIRECT_URL: valid.DATABASE_URL }, { DATABASE_URL: valid.DATABASE_URL.replace("?sslmode=require", "") }, { SUPABASE_URL: "https://otherproject.supabase.co" }]) expect(() => parseProductionEnvironment({ ...valid, ...overrides })).toThrow();
  });
  it("refuses the dev project even if it is only identified by the dev pooler", () => {
    expect(() => parseProductionEnvironment(valid, { SUPABASE_URL: valid.SUPABASE_URL })).toThrow("project Supabase riêng");
    expect(() => parseProductionEnvironment(valid, { DATABASE_URL: valid.DATABASE_URL })).toThrow("project Supabase riêng");
  });
  it("rejects test databases, the Resend test sender and missing production fields without printing secrets", () => {
    for (const overrides of [{ TEST_DATABASE_URL: "postgresql://localhost/app_test" }, { EMAIL_FROM: "onboarding@resend.dev" }, { SUPABASE_SERVICE_ROLE_KEY: "" }]) expect(() => parseProductionEnvironment({ ...valid, ...overrides })).toThrow();
    try { parseProductionEnvironment({ ...valid, DIRECT_URL: "" }); } catch (error) { expect(String(error)).not.toContain("test-only-private-key"); expect(String(error)).not.toContain(valid.DATABASE_URL); }
  });
});
