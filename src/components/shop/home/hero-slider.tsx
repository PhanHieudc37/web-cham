"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getImageProps } from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { HomeDTO } from "@/types/dto";

function BannerPicture({ banner, priority }: { banner: HomeDTO["banners"][number]; priority: boolean }) {
  const [failed, setFailed] = useState(false);
  const { props: desktop } = getImageProps({ src: failed ? "/images/placeholder.svg" : banner.desktopImageUrl, width: 1920, height: 800, alt: banner.alt, sizes: "100vw", priority });
  const { props: mobile } = getImageProps({ src: failed ? "/images/placeholder.svg" : banner.mobileImageUrl, width: 800, height: 1000, alt: banner.alt, sizes: "100vw", priority });
  return <>
    {priority && <>
      <link rel="preload" as="image" imageSrcSet={desktop.srcSet ?? desktop.src} imageSizes="100vw" media="(min-width:768px)" />
      <link rel="preload" as="image" imageSrcSet={mobile.srcSet ?? mobile.src} imageSizes="100vw" media="(max-width:767px)" />
    </>}
    <picture>
      <source media="(min-width:768px)" srcSet={desktop.srcSet ?? desktop.src} sizes="100vw" />
      <img {...mobile} alt={banner.alt} className="absolute inset-0 h-full w-full object-cover" fetchPriority={priority ? "high" : "auto"} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} />
    </picture>
  </>;
}

export function HeroSlider({ banners }: { banners: HomeDTO["banners"] }) {
  const reduced = useReducedMotion();
  const [viewport, api] = useEmblaCarousel({ loop: banners.length > 1, duration: reduced ? 0 : 25 });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const select = useCallback(() => { if (api) setSelected(api.selectedScrollSnap()); }, [api]);
  useEffect(() => {
    if (!api) return;
    api.on("select", select);
    return () => { api.off("select", select); };
  }, [api, select]);
  useEffect(() => {
    if (!api || banners.length < 2 || reduced || paused) return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") api.scrollNext(); }, 5000);
    return () => clearInterval(timer);
  }, [api, banners.length, reduced, paused]);
  if (!banners.length) return null;
  return <section className="relative bg-image-bg" aria-label="Banner cửa hàng" aria-roledescription="trình chiếu"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
    <div ref={viewport} className="overflow-hidden">
      <div className="flex touch-pan-y">
        {banners.map((banner, index) => <div key={banner.id} className="relative aspect-[4/5] min-w-0 flex-[0_0_100%] md:aspect-[12/5]" role="group" aria-roledescription="trang chiếu" aria-label={`${index + 1} / ${banners.length}`} aria-hidden={selected !== index}>
          <BannerPicture banner={banner} priority={index === 0} />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
          <div className="shop-container absolute inset-x-0 bottom-12 md:bottom-14">
            <p className="mb-4 max-w-xl text-2xl leading-snug font-semibold tracking-wide text-white uppercase md:text-4xl">{banner.title}</p>
            <Link href={banner.href} className="shop-button shop-button-primary" tabIndex={selected === index ? 0 : -1}>{banner.ctaLabel}</Link>
          </div>
        </div>)}
      </div>
    </div>
    {banners.length > 1 && <>
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1">
        {banners.map((banner, index) => <button key={banner.id} type="button" onClick={() => api?.scrollTo(index)} aria-label={`Đến banner ${index + 1}`} aria-current={selected === index ? "true" : undefined} className="flex size-8 items-center justify-center"><span className={`h-1 w-6 ${selected === index ? "bg-white" : "bg-white/40"}`} /></button>)}
      </div>
      <div className="absolute right-6 bottom-10 hidden gap-2 md:flex">
        <button type="button" className="shop-icon-button bg-white" aria-label="Banner trước" onClick={() => api?.scrollPrev()}><ArrowLeft size={18} /></button>
        <button type="button" className="shop-icon-button bg-white" aria-label="Banner tiếp" onClick={() => api?.scrollNext()}><ArrowRight size={18} /></button>
      </div>
    </>}
  </section>;
}
