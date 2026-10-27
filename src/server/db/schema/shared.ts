import "server-only";

import { timestamp, uuid } from "drizzle-orm/pg-core";

export const primaryId = () => uuid().defaultRandom().primaryKey();
export const createdAt = () => timestamp({ withTimezone: true }).defaultNow().notNull();
export const timestamps = () => ({ createdAt: createdAt(), updatedAt: createdAt() });
