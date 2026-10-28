"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (messages.length < 2 || reduced) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length, reduced]);
  if (!messages.length) return null;
  return <div className="flex h-9 items-center justify-center bg-fg px-4 text-center text-xs text-white md:text-[13px]" data-testid="announcement">
    <p key={index} className="shop-fade line-clamp-1">{messages[index % messages.length]}</p>
  </div>;
}
