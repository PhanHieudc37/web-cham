import "server-only";

import { sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";

export async function readHealth(checkDatabase: boolean): Promise<{ dbMs: number | null }> {
  if (!checkDatabase) return { dbMs: null };
  const database = getDatabase();
  const start = performance.now();
  await database.execute(sql`select 1`);
  return { dbMs: Math.round((performance.now() - start) * 100) / 100 };
}
