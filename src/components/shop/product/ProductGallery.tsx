"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { ProductDetailDTO } from "@/types/dto";
import { ShopImage } from "../common/shop-image";

export function ProductGallery({ images, colorId, name }: { images: ProductDetailDTO["images"]; colorId: string; name: string }) {
  const reduced = useReducedMotion();
  const [viewport, api] = useEmblaCarousel({ loop: false, duration: reduced ? 0 : 25, watchDrag: () => window.matchMedia("(max-width:1023px)").matches });
  const [selected, setSelected] = useState(0);
  const select = useCallback(() => { if (api) setSelected(api.selectedScrollSnap()); }, [api]);
  useEffect(() => { if (!api) return; api.on("select", select); return () => { api.off("select", select); }; }, [api, select]);
  useEffect(() => { const index = images.findIndex((image) => image.colorId === colorId); if (index >= 0) api?.scrollTo(index, reduced); }, [api, colorId, images, reduced]);
  const photos = images.length ? images : [{ id: "placeholder", url: "/images/placeholder.svg", alt: name, colorId: null }];
  function thumbnails(desktop: boolean) {
    return photos.map((image, index) => <button type="button" key={image.id} aria-label={`Xem ảnh ${index + 1}`} aria-pressed={selected === index}
      onClick={() => api?.scrollTo(index, reduced)} className={`relative aspect-square size-[72px] shrink-0 overflow-hidden border bg-image-bg ${selected === index ? "border-fg" : "border-transparent"}`}>
      <ShopImage src={image.url} alt="" sizes="72px" className="object-contain" />
      <span className="sr-only">{desktop ? "Ảnh sản phẩm" : "Ảnh thu nhỏ"}</span>
    </button>);
  }
  return <section aria-label="Ảnh sản phẩm" className="min-w-0" data-testid="product-gallery" data-selected-image={selected}>
    <div className="grid min-w-0 gap-3 lg:grid-cols-[72px_minmax(0,1fr)]">
      <div className="relative col-start-1 row-start-1 hidden min-h-0 lg:block"><div className="absolute inset-0 flex flex-col gap-3 overflow-y-auto">{thumbnails(true)}</div></div>
      <div ref={viewport} className="col-start-1 row-start-1 min-w-0 overflow-hidden bg-image-bg lg:col-start-2">
        <div className="flex touch-pan-y">{photos.map((image, index) => <div key={image.id} className="relative aspect-square min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="ảnh" aria-label={`${index + 1} / ${photos.length}`} aria-hidden={selected !== index}>
          <ShopImage src={image.url} alt={image.alt || name} sizes="(min-width:1024px) 50vw, 100vw" className="object-contain" priority={index === 0} />
        </div>)}</div>
      </div>
      {photos.length > 1 && <div className="flex justify-center gap-1 lg:hidden">{photos.map((image, index) => <button key={image.id} type="button" aria-label={`Đến ảnh ${index + 1}`} aria-current={selected === index ? "true" : undefined} className="flex size-8 items-center justify-center" onClick={() => api?.scrollTo(index, reduced)}><span className={`size-1.5 rounded-full ${selected === index ? "bg-fg" : "bg-border"}`} /></button>)}</div>}
      <div className="flex gap-2 overflow-x-auto py-1 lg:hidden">{thumbnails(false)}</div>
    </div>
  </section>;
}
