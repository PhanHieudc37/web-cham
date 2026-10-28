import { describe, expect, it } from "vitest";
import { formatDateTime, formatPrice, maskPhone } from "./format";
import { normalizePhone, normalizeVietnamese } from "./normalize";
import { slugify, uniqueSlug } from "./slug";
import { phoneSchema } from "./validation/common";
import { checkoutSchema, cartQuoteSchema } from "./validation/checkout";
import { parseListingFilters } from "./validation/listing";
import { vietQrUrl } from "./vietqr";

describe("Vietnamese formatting and normalization", () => {
  it("normalizes accents, uppercase Đ and Unicode decomposed text", () => {
    expect(normalizeVietnamese("  ÁO   ĐỎ\nĐẸP  ")).toBe("ao do dep");
    expect(normalizeVietnamese("a\u0301o")).toBe("ao");
    expect(normalizeVietnamese("")).toBe("");
  });
  it("normalizes valid Vietnamese mobile formats and rejects invalid ones", () => {
    for (const input of ["0912 345 678", "+84 (912) 345-678", "84912345678", "0912.345.678"]) {
      expect(normalizePhone(input)).toBe("0912345678"); expect(phoneSchema.parse(input)).toBe("0912345678");
    }
    for (const input of ["123", "0123456789", "09123456789", "abc0912345678"]) expect(phoneSchema.safeParse(input).success).toBe(false);
  });
  it("formats VND and the Vietnamese day across a UTC date boundary", () => {
    expect(formatPrice(199000)).toBe("199.000₫");
    expect(formatPrice(0)).toBe("0₫");
    expect(formatDateTime("2026-10-27T18:05:00Z")).toBe("01:05 28/10/2026");
    expect(formatDateTime("invalid")).toBe("—");
  });
  it("masks the middle digits without exposing short invalid phone values", () => {
    expect(maskPhone("0912345678")).toBe("0912***678"); expect(maskPhone("123")).toBe("***");
  });
});
describe("shared input helpers", () => {
  it("creates Vietnamese slugs and finds the first unused suffix", async () => {
    expect(slugify("  Áo Đỏ / Oversize! ")).toBe("ao-do-oversize");
    expect(await uniqueSlug("Áo đỏ", async (slug) => ["ao-do", "ao-do-2"].includes(slug))).toBe("ao-do-3");
    expect(await uniqueSlug("!!!", async () => false)).toBe("san-pham");
  });
  it("ignores malformed URL filters while keeping supported values", () => {
    expect(parseListingFilters({ page: "-1", sort: "sql", price: "wrong", size: "M,L,M,,", color: ["den"], instock: "1" })).toEqual({ page: 1, sort: undefined, price: null, sizes: ["M", "L"], colors: [], inStock: true });
    expect(parseListingFilters({ page: "2", sort: "price-asc", price: "200-400", color: "den,trang" })).toMatchObject({ page: 2, sort: "price-asc", price: "200-400", colors: ["den", "trang"] });
  });
  it("rejects duplicate lines, fractional quantity, nonzero discount codes, and missing policy agreement", () => {
    const line = { variantId: "c9391919-ea45-4d43-a19d-662927fcd83c", quantity: 1 };
    expect(cartQuoteSchema.safeParse({ lines: [line, line] }).success).toBe(false);
    expect(cartQuoteSchema.safeParse({ lines: [{ ...line, quantity: 1.5 }] }).success).toBe(false);
    expect(cartQuoteSchema.safeParse({ lines: [line], discountCode: "FAKE" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ lines: [line], acceptedPolicies: false }).success).toBe(false);
  });
  it("builds an encoded VietQR URL without treating the order code as query parameters", () => {
    const url = new URL(vietQrUrl({ bankBin: "970436", accountNo: "123456789", accountName: "NGUYEN VAN A" }, 199000, "CS123 & paid=1"));
    expect(url.origin).toBe("https://img.vietqr.io"); expect(url.searchParams.get("addInfo")).toBe("CS123 & paid=1");
    expect(url.searchParams.get("amount")).toBe("199000");
  });
});
