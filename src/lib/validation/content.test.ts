import { describe, expect, it } from "vitest";
import { fromVietnameseDateInput, toVietnameseDateInput } from "@/lib/date-input";
import { bannerInputSchema } from "./banner";
import { collectionInputSchema } from "./collection";
import { settingsInputSchema, settingsSchemas, defaultSettings } from "./settings";
const banner = { title: "Banner", desktopImageUrl: "/images/placeholder.svg", desktopImagePath: "/images/placeholder.svg", mobileImageUrl: "/images/placeholder.svg", mobileImagePath: "/images/placeholder.svg", alt: "Ảnh", href: "/collections/all", ctaLabel: "MUA NGAY", sortOrder: 0, isActive: true, startsAt: null, endsAt: null };
describe("content and settings validation", () => {
  it("handles Vietnam date inputs without depending on the machine time zone", () => {
    expect(toVietnameseDateInput("2026-10-27T18:05:00Z")).toBe("2026-10-28T01:05"); expect(fromVietnameseDateInput("2026-10-28T01:05")).toBe("2026-10-27T18:05:00.000Z");
    expect(toVietnameseDateInput(null)).toBe(""); expect(toVietnameseDateInput("invalid")).toBe(""); expect(fromVietnameseDateInput("")).toBeNull();
  });
  it("rejects invalid banner dates and unsafe navigation targets", () => {
    expect(bannerInputSchema.safeParse({ ...banner, startsAt: "2026-10-28T02:00:00Z", endsAt: "2026-10-28T01:00:00Z" }).success).toBe(false);
    for (const href of ["javascript:alert(1)", "//example.test", "/\\example.test", "/foo bar", "https://"]) expect(bannerInputSchema.safeParse({ ...banner, href }).success).toBe(false);
    expect(bannerInputSchema.safeParse({ ...banner, href: "https://example.test/page" }).success).toBe(true);
  });
  it("requires unique selected product ids and allows automatic collection slugs", () => {
    const id = "3f9c8515-b6ba-48cc-99d0-4045ad08b42f";
    const data = { title: "Bộ sưu tập", isActive: true, showOnHome: false, showInMenu: false, sortOrder: 0, productIds: [id, id] };
    expect(collectionInputSchema.safeParse(data).success).toBe(false);
    expect(collectionInputSchema.parse({ ...data, slug: "", productIds: [] }).slug).toBeUndefined();
  });
  it("validates every setting discriminant, email, URLs and integer shipping amounts", () => {
    for (const [key, value] of Object.entries(defaultSettings)) expect(settingsInputSchema.safeParse({ key, value }).success, key).toBe(true);
    expect(settingsInputSchema.safeParse({ key: "shop", value: { ...defaultSettings.shop, email: "invalid" } }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ key: "social", value: { ...defaultSettings.social, facebook: "https://" } }).success).toBe(false);
    expect(settingsSchemas.shipping.safeParse({ fee: 30000.5, freeShipMinItems: null, freeShipMinAmount: null }).success).toBe(false);
    expect(settingsSchemas.shipping.safeParse({ fee: 30000, freeShipMinItems: null, freeShipMinAmount: null }).success).toBe(true);
  });
  it("normalizes the account holder and rejects an unknown BIN or excessive order limit", () => {
    expect(settingsSchemas.bank.parse({ bankBin: "970436", bankName: "Vietcombank", accountNo: "123456", accountName: "  Nguyễn Đỏ  " }).accountName).toBe("NGUYEN DO");
    expect(settingsSchemas.bank.safeParse({ ...defaultSettings.bank, bankBin: "111111" }).success).toBe(false);
    expect(settingsSchemas.orders.safeParse({ ...defaultSettings.orders, maxQtyPerLine: 11 }).success).toBe(false);
    for (const icon of ["truck", "refresh", "wallet", "message", "shield", "gift"]) expect(settingsSchemas.policies.safeParse([{ icon, text: "Cam kết của shop" }]).success).toBe(true);
  });
});
