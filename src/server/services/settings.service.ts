import "server-only";

import { eq, sql } from "drizzle-orm";
import { bankTransferEnabled, defaultSettings, settingsSchemas, settingKeySchema, type SettingKey, type Settings } from "@/lib/validation/settings";
import type { PublicSettingsDTO } from "@/types/dto";
import { cached, CACHE_TAGS } from "@/server/cache";
import { getDatabase, type Database, type DatabaseReader } from "@/server/db/client";
import { settings } from "@/server/db/schema";
import { assertStoredMedia, removeUnusedMedia } from "./media.service";

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

function imageURLs(key: SettingKey, value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const fields = key === "shop" ? ["logoUrl"] : key === "seo" ? ["ogImageUrl"] : key === "legal" ? ["bctBadgeUrl"] : [];
  return fields.flatMap((field) => { const item = Reflect.get(value, field); return typeof item === "string" && item ? [item] : []; });
}
function storagePath(url: string) { const prefix = `${process.env.SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/media/`; return url.startsWith(prefix) ? url.slice(prefix.length) : null; }
export async function saveSetting<K extends SettingKey>(key: K, input: Settings[K], actorId: string, db: Database = getDatabase(), removeMedia = removeUnusedMedia) {
  const value = parseSetting(key, input);
  const removed = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`setting:${key}`}, 0))`);
    const previous = await getSetting(key, tx), oldImages = imageURLs(key, previous), newImages = imageURLs(key, value);
    for (const url of newImages) if (!oldImages.includes(url)) assertStoredMedia({ url, path: storagePath(url) ?? "" }, "settings");
    await tx.insert(settings).values({ key, value, updatedBy: actorId }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date(), updatedBy: actorId } });
    return oldImages.filter((url) => !newImages.includes(url)).flatMap((url) => { const path = storagePath(url); return path ? [path] : []; });
  });
  await removeMedia(removed);
  return { key };
}
export async function getSetting<K extends SettingKey>(key: K, reader: DatabaseReader = getDatabase()): Promise<Settings[K]> {
  const [row] = await reader.select({ value: settings.value }).from(settings).where(eq(settings.key, key));
  return row ? parseSetting(key, row.value) : structuredClone(defaultSettings[key]);
}
