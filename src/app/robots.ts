import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/server/services/seo.service";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/cart", "/api", "/kiem-tra-don-hang", "/search"] }, sitemap: new URL("/sitemap.xml", getSiteUrl()).toString() };
}
