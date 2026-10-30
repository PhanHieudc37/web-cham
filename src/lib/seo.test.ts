import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, organizationJsonLd, productJsonLd, serializeJsonLd } from "./seo";
import { defaultSettings } from "./validation/settings";
import type { ProductDetailDTO } from "@/types/dto";

const product: ProductDetailDTO = { id: "id", slug: "ao-thun", name: "Áo thun </script><script>alert(1)</script>", code: "CS01", price: 199000, compareAtPrice: null, discountPercent: null, image: null, hoverImage: null, colors: [], isNew: false, isSoldOut: false, description: "Mô tả", material: null, fit: null, care: [], category: { name: "Áo", slug: "ao", parent: null }, images: [{ id: "image", url: "/images/placeholder.svg", alt: "Áo", colorId: null }], colorOptions: [], sizes: ["M"], variants: [{ id: "variant", colorId: "color", size: "M", sku: "CS01-M", available: true, maxQuantity: 2, lowStockCount: 2 }], sizeChart: null, seo: { title: "Áo", description: "Mô tả sản phẩm" } };
describe("public structured data", () => {
  it("encodes HTML delimiters so product text cannot break out of a JSON-LD script", () => {
    const data = productJsonLd(product, "https://shop.example.test"); const text = serializeJsonLd(data);
    expect(text).not.toContain("</script>"); expect(JSON.parse(text)).toEqual(data);
    expect(data.offers).toMatchObject({ priceCurrency: "VND", price: 199000, availability: "https://schema.org/InStock", url: "https://shop.example.test/products/ao-thun" });
    expect(data.image).toEqual(["https://shop.example.test/images/placeholder.svg"]);
    expect(productJsonLd({ ...product, variants: product.variants.map((variant) => ({ ...variant, available: false })) }, "https://shop.example.test").offers.availability).toBe("https://schema.org/OutOfStock");
  });
  it("uses ordered absolute breadcrumbs and does not invent organization contact fields", () => {
    expect(breadcrumbJsonLd([{ label: "Trang chủ", href: "/" }, { label: "Áo", href: "/collections/ao" }], "https://shop.example.test").itemListElement[1]).toMatchObject({ position: 2, item: "https://shop.example.test/collections/ao" });
    const organization = organizationJsonLd({ ...defaultSettings, bankTransferEnabled: false }, "https://shop.example.test");
    for (const key of ["telephone", "email", "address", "logo"]) expect(organization).not.toHaveProperty(key);
  });
});
