import type { z } from "zod";
import type { bannerInputSchema } from "@/lib/validation/banner";
import type { collectionInputSchema } from "@/lib/validation/collection";
export type CollectionInput = z.output<typeof collectionInputSchema>;
export type BannerInput = z.output<typeof bannerInputSchema>;
export type CollectionAdminDTO = CollectionInput & { id: string; productCount: number };
export type BannerAdminDTO = BannerInput & { id: string };
export type ProductChoiceDTO = { id: string; name: string; code: string; imageUrl: string | null; status: "draft" | "active" | "archived" };
