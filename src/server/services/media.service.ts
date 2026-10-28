import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { eq, or, sql } from "drizzle-orm";
import type { MediaReference } from "@/lib/validation/media";
import { getDatabase } from "@/server/db/client";
import { banners, categories, collections, productImages, settings } from "@/server/db/schema";
import { AppError } from "@/server/errors";

function getStorage() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new AppError("INTERNAL", "Chưa cấu hình dịch vụ lưu ảnh.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from("media");
}
export function assertStoredMedia(reference: MediaReference, folder: "products" | "categories" | "banners" | "settings") {
  if (reference.url === "/images/placeholder.svg" && reference.path === reference.url) return;
  if (!new RegExp(`^${folder}/\\d{4}/\\d{2}/[a-f0-9-]{36}\\.(webp|png|jpg)$`).test(reference.path)) throw new AppError("VALIDATION_ERROR", "Đường dẫn ảnh không hợp lệ.");
  const root = process.env.SUPABASE_URL;
  if (!root || reference.url !== `${root.replace(/\/$/, "")}/storage/v1/object/public/media/${reference.path}`) throw new AppError("VALIDATION_ERROR", "Ảnh phải được tải lên kho ảnh của shop.");
}
export async function uploadMedia(file: File, folder: "products" | "banners" | "categories" | "settings"): Promise<MediaReference> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!((file.type === "image/png" && png) || (file.type === "image/jpeg" && jpeg) || (file.type === "image/webp" && webp))) throw new AppError("VALIDATION_ERROR", "Nội dung tệp không phải định dạng ảnh đã khai báo.");
  const now = new Date(), extension = png ? "png" : jpeg ? "jpg" : "webp";
  const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
  const storage = getStorage();
  const { error } = await storage.upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new AppError("INTERNAL", "Không tải được ảnh lên. Vui lòng thử lại.");
  return { path, url: storage.getPublicUrl(path).data.publicUrl };
}
export async function removeUnusedMedia(paths: string[]) {
  for (const path of [...new Set(paths)]) {
    if (!/^(products|categories|banners|settings)\/\d{4}\/\d{2}\/[a-f0-9-]{36}\.(webp|png|jpg)$/.test(path)) continue;
    try {
      const db = getDatabase();
      const [productRefs, categoryRefs, collectionRefs, bannerRefs, settingRefs] = await Promise.all([
        db.select({ id: productImages.id }).from(productImages).where(eq(productImages.storagePath, path)).limit(1),
        db.select({ id: categories.id }).from(categories).where(eq(categories.imagePath, path)).limit(1),
        db.select({ id: collections.id }).from(collections).where(eq(collections.bannerPath, path)).limit(1),
        db.select({ id: banners.id }).from(banners).where(or(eq(banners.desktopImagePath, path), eq(banners.mobileImagePath, path))).limit(1),
        db.select({ key: settings.key }).from(settings).where(sql`position(${path} in ${settings.value}::text) > 0`).limit(1),
      ]);
      if ([productRefs, categoryRefs, collectionRefs, bannerRefs, settingRefs].some((rows) => rows.length)) continue;
      const { error } = await getStorage().remove([path]);
      if (error) console.error("[media] Cannot remove an unused image");
    } catch { console.error("[media] Cannot remove an unused image"); }
  }
}
