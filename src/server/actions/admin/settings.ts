"use server";

import { z } from "zod";
import { settingKeySchema } from "@/lib/validation/settings";
import { requireRole } from "@/server/auth/guards";
import { CACHE_TAGS, invalidate } from "@/server/cache";
import { runAction } from "@/server/run-action";
import { parseSetting, saveSetting } from "@/server/services/settings.service";

// Permission boundary is established in Phase 3; the editing UI comes in Phase 5.
export async function updateSettingsAction(input: unknown) {
  return runAction(async () => {
    const values = z.object({ key: settingKeySchema, value: z.unknown() }).parse(input);
    const value = parseSetting(values.key, values.value);
    const actor = await requireRole("admin");
    const result = await saveSetting(values.key, value, actor.id);
    invalidate(CACHE_TAGS.settings);
    return result;
  });
}
