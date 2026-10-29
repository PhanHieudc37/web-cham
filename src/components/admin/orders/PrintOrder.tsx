"use client";

import { useEffect, useRef } from "react";
export function PrintOrder() {
  const printed = useRef(false);
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => { if (active && !printed.current) { printed.current = true; window.print(); } });
    return () => { active = false; };
  }, []);
  return <button className="mb-6 rounded-md border px-4 py-3 text-sm print:hidden" onClick={() => window.print()}>In lại phiếu</button>;
}
