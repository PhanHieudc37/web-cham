import { HeroSlider } from "@/components/shop/home/hero-slider";
import { BrandStory, CategoryTiles, PolicyStrip } from "@/components/shop/home/home-sections";
import { ProductSection } from "@/components/shop/common/product-card";
import { getHome } from "@/server/services/catalog.service";
import { getPublicSettings } from "@/server/services/settings.service";

export default async function HomePage() {
  const [home, settings] = await Promise.all([getHome(), getPublicSettings()]);
  const storyImage = home.collections.find(({ bannerUrl }) => bannerUrl)?.bannerUrl ?? home.banners[0]?.desktopImageUrl ?? home.categories.find(({ imageUrl }) => imageUrl)?.imageUrl ?? null;
  return <>
    <h1 className="sr-only">{settings.shop.name}</h1>
    <HeroSlider banners={home.banners} />
    <CategoryTiles home={home} />
    <ProductSection title="BEST SELLER" slug="best-seller" products={home.bestSeller} />
    <ProductSection title="NEW ARRIVAL" slug="new-arrival" products={home.newArrival} />
    {home.collections.map((collection) => <ProductSection key={collection.slug} title={collection.title} slug={collection.slug} products={collection.products} />)}
    <ProductSection title="SALE" slug="sale" products={home.sale} />
    <BrandStory settings={settings} image={storyImage} />
    <PolicyStrip policies={settings.policies} />
  </>;
}
