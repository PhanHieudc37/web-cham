"use client";

import { useState } from "react";
import type { ProductDetailDTO } from "@/types/dto";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { useProductAvailability } from "@/hooks/use-product-availability";

export function ProductExperience({ product, children, sizeChart }: { product: ProductDetailDTO; children: React.ReactNode; sizeChart: React.ReactNode }) {
  const availability = useProductAvailability(product.id);
  const currentProduct = availability.data ? { ...product, ...availability.data } : product;
  const first = currentProduct.colorOptions.find((color) => currentProduct.variants.some((variant) => variant.colorId === color.id && variant.available));
  const [selectedColorId, setColorId] = useState(first?.id ?? product.colorOptions[0]?.id ?? "");
  const colorId = currentProduct.variants.some((variant) => variant.colorId === selectedColorId && variant.available) ? selectedColorId : first?.id ?? selectedColorId;
  return <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:gap-12">
    <ProductGallery images={product.images} colorId={colorId} name={product.name} />
    <ProductPurchasePanel key={colorId} product={currentProduct} colorId={colorId} onColorChange={setColorId} sizeChart={sizeChart} availabilityReady={Boolean(availability.data)} availabilityError={availability.error} retryAvailability={availability.retry}>{children}</ProductPurchasePanel>
  </div>;
}
