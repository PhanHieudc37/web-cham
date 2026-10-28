"use client";
import Image from "next/image";
import { useState } from "react";
export function AdminImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <Image src={failed || !src ? "/images/placeholder.svg" : src} alt={alt} width={400} height={400} sizes="(max-width: 768px) 45vw, 200px" className={`object-contain ${className}`} onError={() => setFailed(true)} unoptimized />;
}
