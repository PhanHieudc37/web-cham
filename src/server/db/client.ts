import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseEnv } from "@/server/env";
import * as schema from "./schema";

export function createDatabase(url: string) {
  const connection = postgres(url, { prepare: false, max: 10, onnotice: () => undefined });
  return { connection, db: drizzle(connection, { schema, casing: "snake_case" }) };
}

export type Database = ReturnType<typeof createDatabase>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DatabaseReader = Database | Transaction;
let database: ReturnType<typeof createDatabase> | undefined;

export function getDatabase() {
  database ??= createDatabase(getDatabaseEnv().DATABASE_URL);
  return database.db;
}
