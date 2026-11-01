import { existsSync, readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { parse } from "dotenv";
import { sql } from "drizzle-orm";
import { defaultSettings, settingKeySchema, settingsSchemas } from "../src/lib/validation/settings";
import { parseProductionEnvironment } from "../src/lib/validation/production";
import { createDatabase } from "../src/server/db/client";
import { settings } from "../src/server/db/schema";

const env = parseProductionEnvironment(parse(readFileSync(".env.deploy.local")), existsSync(".env") ? parse(readFileSync(".env")) : {});
const database = createDatabase(env.DATABASE_URL);
try {
  const inventory = await database.db.transaction(async (transaction) => {
    await transaction.execute(sql`SET TRANSACTION READ ONLY`);
    const [counts] = await transaction.execute<{ products: number; orders: number; messages: number; nonAdminUsers: number; admins: number; mediaObjects: number }>(sql`SELECT
      (SELECT count(*)::integer FROM products) AS products,
      (SELECT count(*)::integer FROM orders) AS orders,
      (SELECT count(*)::integer FROM contact_messages) AS messages,
      (SELECT count(*)::integer FROM "user" WHERE role IS DISTINCT FROM 'admin') AS "nonAdminUsers",
      (SELECT count(*)::integer FROM "user" WHERE role = 'admin') AS admins,
      (SELECT count(*)::integer FROM storage.objects WHERE bucket_id = 'media') AS "mediaObjects"`);
    const changedSettingKeys: string[] = [], invalidSettingKeys: string[] = [];
    let unknownSettingKeys = 0;
    for (const row of await transaction.select().from(settings)) {
      const key = settingKeySchema.safeParse(row.key);
      if (!key.success) { unknownSettingKeys++; continue; }
      const value = settingsSchemas[key.data].safeParse(row.value);
      if (!value.success) { invalidSettingKeys.push(key.data); continue; }
      if (!isDeepStrictEqual(value.data, defaultSettings[key.data])) changedSettingKeys.push(key.data);
    }
    return { counts, changedSettingKeys, invalidSettingKeys, unknownSettingKeys };
  });
  // Values remain in memory: no customer, account, bank details or media paths leave this script.
  console.log(JSON.stringify({ at: new Date().toISOString(), projectRef: new URL(env.SUPABASE_URL).hostname.split(".")[0], ...inventory }));
} catch {
  console.error("Không đọc được inventory production; không xuất SQL parameters hoặc credential.");
  process.exitCode = 1;
} finally { await database.connection.end({ timeout: 3 }); }
