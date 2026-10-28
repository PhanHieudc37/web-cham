import "server-only";

import { isIP } from "node:net";
import { headers } from "next/headers";
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const first = requestHeaders.get("x-forwarded-for")?.split(",")[0].trim();
  return first && isIP(first) ? first : "unknown";
}
