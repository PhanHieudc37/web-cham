import "server-only";

import { sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import type { DatabaseReader } from "./client";

export type DatabasePage<T> = { items: T[]; total: number; page: number; totalPages: number };
export async function readDatabasePage<T>(db: DatabaseReader, input: {
  id: SQLWrapper; fields: Record<string, SQLWrapper>; from: SQL; where?: SQL; order: SQL; page: number; pageSize?: number;
}): Promise<DatabasePage<T>> {
  const requested = Math.floor(input.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 100000) : 1;
  const size = input.pageSize ?? ADMIN_PAGE_SIZE;
  if (!Number.isSafeInteger(size) || size < 1 || size > 100) throw new Error("Invalid internal page size");
  const fields = sql.join(Object.entries(input.fields).flatMap(([name, value]) => [sql`${name}::text`, sql`${value}`]), sql`, `);
  // Rank/count only IDs. Build JSON (including image subqueries) for the selected
  // page, rather than for every matched row. One snapshot also handles an empty
  // or out-of-range page without count/retry round trips.
  const [result] = await db.execute<DatabasePage<T>>(sql`
    WITH page_ids AS (
      SELECT ${input.id} AS row_id, row_number() OVER (ORDER BY ${input.order}) AS row_number,
        count(*) OVER ()::integer AS total
      FROM ${input.from} ${input.where ? sql`WHERE ${input.where}` : sql``}
    ), page_totals AS (
      SELECT coalesce(max(total), 0)::integer AS total FROM page_ids
    ), page_bounds AS (
      SELECT total, greatest(1, ceil(total::numeric / ${size}))::integer AS "totalPages" FROM page_totals
    ), page_meta AS (
      SELECT total, "totalPages", least(${page}, "totalPages")::integer AS page FROM page_bounds
    )
    SELECT total, page, "totalPages", coalesce((
      SELECT jsonb_agg(jsonb_build_object(${fields}) ORDER BY page_ids.row_number)
      FROM ${input.from} INNER JOIN page_ids ON ${input.id} = page_ids.row_id
      WHERE page_ids.row_number > (page_meta.page - 1) * ${size}
        AND page_ids.row_number <= page_meta.page * ${size}
    ), '[]'::jsonb) AS items FROM page_meta`);
  return result;
}
