import "server-only";

import { parseEnvironment, serverEnvSchema } from "@/lib/validation/env";

export function getServerEnv() {
  return parseEnvironment(serverEnvSchema, process.env);
}
