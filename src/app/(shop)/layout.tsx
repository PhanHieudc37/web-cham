import { AnnouncementBar } from "@/components/shop/layout/announcement-bar";
import { Header } from "@/components/shop/layout/header";
import { Footer } from "@/components/shop/layout/footer";
import { FloatingContact } from "@/components/shop/layout/floating-contact";
import { CartHydrator } from "@/components/shop/cart/CartHydrator";
import { CartDrawerLoader } from "@/components/shop/cart/CartDrawerLoader";
import { getMenu } from "@/server/services/catalog.service";
import { getPublicSettings } from "@/server/services/settings.service";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, menu] = await Promise.all([getPublicSettings(), getMenu()]);
  return <div className="shop-theme min-w-0">
    <CartHydrator />
    <a href="#shop-main" className="sr-only z-50 bg-white p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Đến nội dung chính</a>
    <AnnouncementBar messages={settings.announcements} />
    <Header menu={menu} settings={settings} />
    <main id="shop-main" tabIndex={-1}>{children}</main>
    <Footer settings={settings} />
    <FloatingContact settings={settings} />
    <CartDrawerLoader />
  </div>;
}
