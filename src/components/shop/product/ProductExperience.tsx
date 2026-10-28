"use client";

import { useState } from "react";
import type { ProductDetailDTO } from "@/types/dto";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchasePanel } from "./ProductPurchasePanel";

export function ProductExperience({ product, children, sizeChart }: { product: ProductDetailDTO; children: React.ReactNode; sizeChart: React.ReactNode }) {
  const first = product.colorOptions.find((color) => product.variants.some((variant) => variant.colorId === color.id && variant.available));
  const [colorId, setColorId] = useState(first?.id ?? product.colorOptions[0]?.id ?? "");
  return <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:gap-12">
    <ProductGallery images={product.images} colorId={colorId} name={product.name} />
    <ProductPurchasePanel key={colorId} product={product} colorId={colorId} onColorChange={setColorId} sizeChart={sizeChart}>{children}</ProductPurchasePanel>
  </div>;
}
