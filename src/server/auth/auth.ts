import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { hasRole } from "@/lib/auth";
import { getDatabase, type DatabaseReader } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { authOptions } from "./schema-config";

export type AuthConfiguration = { baseURL: string; secret: string };
export function createAuth(db: DatabaseReader, config: AuthConfiguration, cookiePlugin = false) {
  return betterAuth({
    ...authOptions, ...config, database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    plugins: [...authOptions.plugins, ...(cookiePlugin ? [nextCookies()] : [])],
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, window: 60, max: 60, customRules: { "/sign-in/email": { window: 60, max: 10 } } },
    logger: { disabled: true },
    databaseHooks: { session: { create: { before: async (entry) => {
      const [person] = await db.select({ role: schema.user.role, banned: schema.user.banned }).from(schema.user).where(eq(schema.user.id, entry.userId));
      return person && !person.banned && hasRole(person.role, "staff") ? { data: entry } : false;
    } } } },
  });
}
export function getAuthConfiguration(): AuthConfiguration {
  const { BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL: baseURL } = process.env;
  if (!secret || secret.length < 32 || !baseURL) throw new Error("Cần cấu hình BETTER_AUTH_SECRET và BETTER_AUTH_URL");
  return { secret, baseURL };
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return auth ??= createAuth(getDatabase(), getAuthConfiguration(), true); }
