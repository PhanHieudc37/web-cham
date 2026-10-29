import "server-only";

import { asc } from "drizzle-orm";
import { cached, CACHE_TAGS } from "@/server/cache";
import { getDatabase, type DatabaseReader } from "@/server/db/client";
import { sizeCharts } from "@/server/db/schema";

export async function readSizeCharts(reader: DatabaseReader) {
  return reader.select({ id: sizeCharts.id, name: sizeCharts.name, columns: sizeCharts.columns, rows: sizeCharts.rows, note: sizeCharts.note }).from(sizeCharts).orderBy(asc(sizeCharts.name), asc(sizeCharts.id));
}
export const getSizeCharts = cached(async () => readSizeCharts(getDatabase()), ["public-size-charts"], [CACHE_TAGS.products]);
