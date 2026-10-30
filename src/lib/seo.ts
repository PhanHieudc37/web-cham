import type { ProductDetailDTO, PublicSettingsDTO } from "@/types/dto";

export const PUBLIC_PAGES = ["/", "/gioi-thieu", "/chinh-sach-doi-tra", "/chinh-sach-bao-mat", "/dieu-khoan-dich-vu", "/huong-dan-chon-size", "/lien-he"] as const;
export const AUTOMATIC_COLLECTIONS = ["all", "new-arrival", "best-seller", "sale"] as const;
export function absoluteUrl(path: string, site: string) { return new URL(path, site).toString(); }
export function serializeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function breadcrumbJsonLd(items: { label: string; href: string }[], site: string) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, item: absoluteUrl(item.href, site) })) };
}
export function productJsonLd(product: ProductDetailDTO, site: string) {
  return { "@context": "https://schema.org", "@type": "Product", "@id": absoluteUrl(`/products/${product.slug}#product`, site), name: product.name, sku: product.code, description: product.seo.description,
    ...(product.images.length ? { image: product.images.map((image) => absoluteUrl(image.url, site)) } : {}),
    offers: { "@type": "Offer", url: absoluteUrl(`/products/${product.slug}`, site), price: product.price, priceCurrency: "VND", availability: `https://schema.org/${product.variants.some((variant) => variant.available && variant.maxQuantity > 0) ? "InStock" : "OutOfStock"}` } };
}
export function organizationJsonLd(settings: PublicSettingsDTO, site: string) {
  const { shop, social } = settings;
  return { "@context": "https://schema.org", "@type": "Organization", "@id": absoluteUrl("/#organization", site), name: shop.name, url: absoluteUrl("/", site),
    ...(shop.logoUrl ? { logo: absoluteUrl(shop.logoUrl, site) } : {}), ...(shop.phone ? { telephone: shop.phone } : {}), ...(shop.email ? { email: shop.email } : {}), ...(shop.address ? { address: shop.address } : {}),
    sameAs: [...new Set(Object.values(social).filter((value) => /^https?:\/\//.test(value)))] };
}
