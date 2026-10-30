"use client";

import Image from "next/image";
import { useState } from "react";

export function ShopImage({ src, alt, sizes, className = "", priority = false }: {
  src: string | null; alt: string; sizes: string; className?: string; priority?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = src && failedSource !== src ? src : "/images/placeholder.svg";
  return <Image src={source} alt={alt} fill sizes={sizes} className={className} preload={priority}
    unoptimized={source.endsWith(".svg")} onError={() => setFailedSource(src)} />;
}
