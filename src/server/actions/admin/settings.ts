"use server";
import { refreshAdminPaths } from "@/server/admin-refresh";

import { settingsInputSchema } from "@/lib/validation/settings";
import { requireRole } from "@/server/auth/guards";
import { CACHE_TAGS, invalidate, warmPaths } from "@/server/cache";
import { runAction } from "@/server/run-action";
import { saveSetting } from "@/server/services/settings.service";

export async function updateSettingsAction(input: unknown) {
  return runAction(async () => {
    const values = settingsInputSchema.parse(input);
    const actor = await requireRole("admin");
    const result = await saveSetting(values.key, values.value, actor.id);
    invalidate(CACHE_TAGS.settings);
    refreshAdminPaths(["/admin/settings", "/admin", "/admin/products", "/admin/products/[id]", "/admin/products/new"]);
    warmPaths(["/"]);
    return result;
  });
}
