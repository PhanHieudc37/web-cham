import "server-only";

import { afterEach, describe, expect, it, vi } from "vitest";
import { localEnvSchema, parseEnvironment, serverEnvSchema } from "@/lib/validation/env";
import { getServerEnv } from "@/server/env";

const localValues = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-which-is-at-least-32-characters",
  SUPABASE_STORAGE_BUCKET: "media",
};
const serviceValues = {
  ...localValues,
  DATABASE_URL: "postgresql://test:test@localhost:5432/cham_stu_test",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
};

afterEach(() => vi.unstubAllEnvs());

describe("environment validation", () => {
  it("runs the local shell without external services", () => {
    expect(parseEnvironment(localEnvSchema, localValues).NEXT_PUBLIC_SITE_URL).toBe(localValues.NEXT_PUBLIC_SITE_URL);
  });
  it.each(Object.keys(localValues))("names the missing local variable %s", (key) => {
    expect(() => parseEnvironment(localEnvSchema, { ...localValues, [key]: undefined })).toThrow(key);
  });
  it.each(["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"])("requires %s when services are used", (key) => {
    expect(() => parseEnvironment(serverEnvSchema, { ...serviceValues, [key]: "" })).toThrow(key);
  });
  it("accepts standard PostgreSQL connections and optional blank values in development", () => {
    const values = parseEnvironment(serverEnvSchema, { ...serviceValues, RESEND_API_KEY: "", TEST_DATABASE_URL: "" });
    expect(values.DATABASE_URL).toBe(serviceValues.DATABASE_URL);
    expect(values.RESEND_API_KEY).toBeUndefined();
    expect(values.TEST_DATABASE_URL).toBeUndefined();
  });
  it("rejects non-PostgreSQL URLs", () => {
    expect(() => parseEnvironment(serverEnvSchema, { ...serviceValues, DATABASE_URL: "https://localhost/db" })).toThrow("DATABASE_URL");
  });
  it("rejects mismatched authentication and site URLs", () => {
    expect(() => parseEnvironment(localEnvSchema, { ...localValues, BETTER_AUTH_URL: "http://localhost:3001" })).toThrow("BETTER_AUTH_URL");
  });
  it("rejects a short auth secret without printing its value", () => {
    const value = "private-short-secret";
    const parse = () => parseEnvironment(localEnvSchema, { ...localValues, BETTER_AUTH_SECRET: value });
    expect(parse).toThrow("BETTER_AUTH_SECRET");
    expect(parse).not.toThrow(value);
  });
  it("names all missing production email variables", () => {
    const parse = () => parseEnvironment(serverEnvSchema, { ...serviceValues, NODE_ENV: "production" });
    for (const key of ["RESEND_API_KEY", "EMAIL_FROM", "SHOP_NOTIFY_EMAIL"]) expect(parse).toThrow(key);
  });
  it("accepts a complete production configuration", () => {
    expect(parseEnvironment(serverEnvSchema, {
      ...serviceValues, NODE_ENV: "production", RESEND_API_KEY: "test-key",
      EMAIL_FROM: "Test <test@example.com>", SHOP_NOTIFY_EMAIL: "shop@example.com",
    }).NODE_ENV).toBe("production");
  });
  it("requires an explicit email opt-out and rejects unknown delivery modes", () => {
    expect(parseEnvironment(serverEnvSchema, { ...serviceValues, NODE_ENV: "production", EMAIL_DELIVERY: "disabled" }).EMAIL_DELIVERY).toBe("disabled");
    for (const mode of [undefined, "", "off", "false"]) expect(() => parseEnvironment(serverEnvSchema, { ...serviceValues, NODE_ENV: "production", EMAIL_DELIVERY: mode })).toThrow();
  });
  it("reads validated server configuration from process.env", () => {
    for (const [key, value] of Object.entries(serviceValues)) vi.stubEnv(key, value);
    vi.stubEnv("NODE_ENV", "development");
    expect(getServerEnv().DATABASE_URL).toBe(serviceValues.DATABASE_URL);
  });
});
