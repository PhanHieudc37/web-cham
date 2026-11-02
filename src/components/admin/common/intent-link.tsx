"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function IntentLink({ href, onClick, onMouseEnter, onMouseLeave, onFocus, onBlur, onTouchStart, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter(), prefetched = useRef<{ href: string; at: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancel() { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } }
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  function prepare() {
    cancel();
    if (typeof href !== "string" || !/^\/admin(?:\/|\?|$)/.test(href) || props.target || (prefetched.current?.href === href && Date.now() - prefetched.current.at < 30000)) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      prefetched.current = { href, at: Date.now() };
      router.prefetch(href);
    }, 150);
  }
  // A quick click should send the navigation, not race an AUTO prefetch.
  // Sustained intent still warms the loading boundary through the public API.
  return <Link {...props} href={href} prefetch={false}
    onClick={(event) => { cancel(); onClick?.(event); }}
    onMouseEnter={(event) => { onMouseEnter?.(event); if (!event.defaultPrevented) prepare(); }}
    onMouseLeave={(event) => { cancel(); onMouseLeave?.(event); }}
    onFocus={(event) => { onFocus?.(event); if (!event.defaultPrevented) prepare(); }}
    onBlur={(event) => { cancel(); onBlur?.(event); }}
    onTouchStart={(event) => { onTouchStart?.(event); if (!event.defaultPrevented) prepare(); }} />;
}
