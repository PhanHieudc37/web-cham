import "server-only";

import { after } from "next/server";
import { warmPaths } from "./cache";
import { getPublicWarmPaths, type WarmKind } from "./services/public-warm.service";

export function warmCatalog(kind: WarmKind, id: string) {
  after(async () => {
    try { warmPaths(await getPublicWarmPaths(kind, id)); }
    catch { console.warn("[cache] Could not resolve public warm paths"); }
  });
}
