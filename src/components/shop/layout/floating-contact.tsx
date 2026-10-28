import { MessageCircle, Phone } from "lucide-react";
import type { PublicSettingsDTO } from "@/types/dto";
import { BackToTop } from "./back-to-top";

export function FloatingContact({ settings }: { settings: PublicSettingsDTO }) {
  const phone = settings.shop.phone;
  const zalo = settings.shop.zaloPhone.replace(/[^\d+]/g, "");
  const button = "flex size-12 items-center justify-center rounded-full border bg-white shadow-sm transition-colors hover:bg-fg hover:text-white";
  return <aside className="shop-floating fixed right-4 bottom-5 z-30 flex flex-col gap-2 md:right-6 md:bottom-6" aria-label="Liên hệ nhanh">
    {zalo && <a className={button} href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer" aria-label="Liên hệ Zalo"><span className="text-[11px] font-bold">Zalo</span></a>}
    {settings.social.messenger && <a className={button} href={settings.social.messenger} target="_blank" rel="noopener noreferrer" aria-label="Liên hệ Messenger"><MessageCircle size={20} /></a>}
    {phone && <a className={button} href={`tel:${phone}`} aria-label="Gọi cho shop"><Phone size={19} /></a>}
    <BackToTop />
  </aside>;
}
