import "server-only";

import { sql } from "drizzle-orm";
import { AppError } from "./errors";
import { getDatabase, type DatabaseReader } from "./db/client";

export async function rateLimit(key: string, limit: number, seconds: number, reader: DatabaseReader = getDatabase()): Promise<void> {
  const rows = await reader.execute<{ count: number; retry_after: number }>(sql`
    INSERT INTO rate_limits (key, count, reset_at) VALUES (${key}, 1, now() + make_interval(secs => ${seconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
    RETURNING count, GREATEST(1, ceil(extract(epoch FROM reset_at - now())))::integer AS retry_after
  `);
  if (rows[0].count > limit) throw new AppError("RATE_LIMITED", undefined, { retryAfterSeconds: rows[0].retry_after });
  if (Math.random() < 0.01) await reader.execute(sql`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`);
}
