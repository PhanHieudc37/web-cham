import "server-only";

import { eq } from "drizzle-orm";
import { bankTransferEnabled, defaultSettings, settingsSchemas, settingKeySchema, type SettingKey, type Settings } from "@/lib/validation/settings";
import type { PublicSettingsDTO } from "@/types/dto";
import { cached, CACHE_TAGS } from "@/server/cache";
import { getDatabase, type DatabaseReader } from "@/server/db/client";
import { settings } from "@/server/db/schema";

export function parseSetting<K extends SettingKey>(key: K, value: unknown): Settings[K] {
  return settingsSchemas[key].parse(value) as Settings[K];
}
function setSetting<K extends SettingKey>(target: Settings, key: K, value: Settings[K]) { target[key] = value; }
export async function readSettings(reader: DatabaseReader = getDatabase()): Promise<Settings> {
  const result = structuredClone(defaultSettings);
  for (const row of await reader.select().from(settings)) {
    const key = settingKeySchema.safeParse(row.key);
    if (key.success) setSetting(result, key.data, parseSetting(key.data, row.value));
  }
  return result;
}
export const getPublicSettings = cached(async (): Promise<PublicSettingsDTO> => {
  const { shop, social, announcements, policies, returnPolicySummary, shipping, legal, seo, bank } = await readSettings();
  return { shop, social, announcements, policies, returnPolicySummary, shipping, legal, seo, bankTransferEnabled: bankTransferEnabled(bank) };
}, ["public-settings"], [CACHE_TAGS.settings]);

export async function saveSetting<K extends SettingKey>(key: K, input: Settings[K], actorId: string) {
  const value = parseSetting(key, input);
  await getDatabase().insert(settings).values({ key, value, updatedBy: actorId }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date(), updatedBy: actorId } });
  return { key };
}
export async function getSetting<K extends SettingKey>(key: K, reader: DatabaseReader = getDatabase()): Promise<Settings[K]> {
  const [row] = await reader.select({ value: settings.value }).from(settings).where(eq(settings.key, key));
  return row ? parseSetting(key, row.value) : structuredClone(defaultSettings[key]);
}
