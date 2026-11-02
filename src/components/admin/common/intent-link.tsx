"use client";

import { useRef, type ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function IntentLink({ href, onMouseEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter(), prefetched = useRef<{ href: string; at: number } | null>(null);
  function prepare() {
    if (typeof href !== "string" || !/^\/admin(?:\/|\?|$)/.test(href) || props.target || (prefetched.current?.href === href && Date.now() - prefetched.current.at < 30000)) return;
    prefetched.current = { href, at: Date.now() };
    router.prefetch(href);
  }
  return <Link {...props} href={href} prefetch={false}
    onMouseEnter={(event) => { onMouseEnter?.(event); if (!event.defaultPrevented) prepare(); }}
    onFocus={(event) => { onFocus?.(event); if (!event.defaultPrevented) prepare(); }}
    onTouchStart={(event) => { onTouchStart?.(event); if (!event.defaultPrevented) prepare(); }} />;
}
