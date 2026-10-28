import { describe, expect, it } from "vitest";
import { productInputSchema, sizeChartInputSchema } from "./product";

const input = () => ({ name: "Áo thử", code: "test01", categoryId: "8ca9c267-4550-4c68-8522-6593356cd564", status: "draft", price: 100000, compareAtPrice: null,
  colors: [{ name: "Đen", code: "den", hex: "#111111" }], variants: [{ colorCode: "den", size: "M", sku: "TEST01-DEN-M", stock: 5, isActive: true }], images: [] });
describe("product and size chart validation", () => {
  it("requires images and a selling variant for publication", () => {
    expect(productInputSchema.safeParse(input()).success).toBe(true);
    expect(productInputSchema.safeParse({ ...input(), status: "active" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...input(), status: "active", images: [{ url: "/images/placeholder.svg", storagePath: "/images/placeholder.svg", alt: "", colorCode: null }], variants: [{ ...input().variants[0], isActive: false }] }).success).toBe(false);
  });
  it("normalizes codes and rejects invalid money or fractional stock", () => {
    expect(productInputSchema.parse(input()).code).toBe("TEST01");
    for (const price of [0, -1, 1.5]) expect(productInputSchema.safeParse({ ...input(), price }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...input(), compareAtPrice: 50000 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...input(), variants: [{ ...input().variants[0], stock: 1.5 }] }).success).toBe(false);
  });
  it("rejects duplicate SKU/matrix cells and references to unknown colors", () => {
    const base = input();
    expect(productInputSchema.safeParse({ ...base, variants: [...base.variants, base.variants[0]] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, variants: [...base.variants, { ...base.variants[0], size: "L" }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, variants: [{ ...base.variants[0], colorCode: "do" }] }).success).toBe(false);
  });
  it("validates size chart dimensions", () => {
    expect(sizeChartInputSchema.safeParse({ name: "Bảng size", columns: ["Size", "Dài"], rows: [["M"]] }).success).toBe(false);
    expect(sizeChartInputSchema.safeParse({ name: "Bảng size", columns: ["Size", "Dài"], rows: [["M", "65"]] }).success).toBe(true);
  });
});
