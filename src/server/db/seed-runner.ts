import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, sql } from "drizzle-orm";
import { authOptions } from "@/server/auth/schema-config";
import type { Database } from "./client";
import * as schema from "./schema";
import { defaultSettings } from "./seed-data/settings";
import { seedSample } from "./seed-sample";

export type SeedOptions = {
  sample: boolean;
  environment: string;
  adminEmail: string;
  adminPassword: string;
  authSecret: string;
  authUrl: string;
};

export function assertSeedAllowed(options: Pick<SeedOptions, "sample" | "environment">) {
  if (options.sample && options.environment === "production") {
    throw new Error("Không được chạy seed --sample trong môi trường production");
  }
}

export async function seedDatabase(db: Database, options: SeedOptions) {
  assertSeedAllowed(options);
  await db.transaction(async (transaction) => {
    await transaction.execute(sql`SELECT pg_advisory_xact_lock(726037)`);
    for (const [key, value] of Object.entries(defaultSettings)) {
      await transaction.insert(schema.settings).values({ key, value }).onConflictDoNothing();
    }
    if (options.sample) await seedSample(transaction);
  });

  const email = options.adminEmail.toLowerCase();
  const [existing] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email));
  if (!existing) {
    const auth = betterAuth({
      ...authOptions, baseURL: options.authUrl, secret: options.authSecret,
      database: drizzleAdapter(db, { provider: "pg", schema }),
    });
    await auth.api.createUser({ body: { email, password: options.adminPassword, name: "Quản trị viên", role: "admin" } });
  }
}
