import { Globe, Camera, Music2, ShoppingBag } from "lucide-react";
import type { PublicSettingsDTO } from "@/types/dto";

export function SocialLinks({ social }: { social: PublicSettingsDTO["social"] }) {
  const items = [
    { name: "Facebook", href: social.facebook, Icon: Globe }, { name: "Instagram", href: social.instagram, Icon: Camera },
    { name: "TikTok", href: social.tiktok, Icon: Music2 }, { name: "Shopee", href: social.shopee, Icon: ShoppingBag },
  ].filter(({ href }) => Boolean(href));
  if (!items.length) return null;
  return <div className="flex flex-wrap gap-2">{items.map(({ name, href, Icon }) => <a key={name} href={href} aria-label={name} target="_blank" rel="noopener noreferrer" className="shop-icon-button border border-current/25 hover:opacity-60"><Icon size={18} /></a>)}</div>;
}
