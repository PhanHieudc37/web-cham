import "server-only";

import { databaseEnvSchema, parseEnvironment, seedEnvSchema, serverEnvSchema } from "@/lib/validation/env";

export const getDatabaseEnv = () => parseEnvironment(databaseEnvSchema, process.env);
export const getSeedEnv = () => parseEnvironment(seedEnvSchema, process.env);

export function getServerEnv() {
  return parseEnvironment(serverEnvSchema, process.env);
}
