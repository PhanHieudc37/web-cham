"use client";
import Image from "next/image";
import { useState } from "react";
export function AdminImage({ src, alt, className = "", sizes = "96px", unoptimized = false }: { src: string | null; alt: string; className?: string; sizes?: string; unoptimized?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <Image src={failed || !src ? "/images/placeholder.svg" : src} alt={alt} width={400} height={400} sizes={sizes} loading="lazy" unoptimized={unoptimized} className={`object-contain ${className}`} onError={() => setFailed(true)} />;
}
