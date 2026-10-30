"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import type { MenuDTO, PublicSettingsDTO } from "@/types/dto";
const MenuPanel = dynamic(() => import("./mobile-menu").then((module) => module.MobileMenu), { ssr: false });
const SearchPanel = dynamic(() => import("./search-overlay").then((module) => module.SearchOverlay), { ssr: false });
export function MobileMenuLoader(props: { menu: MenuDTO; settings: PublicSettingsDTO }) {
  const [loaded, setLoaded] = useState(false);
  return loaded ? <MenuPanel {...props} initiallyOpen /> : <button type="button" className="shop-icon-button lg:hidden" aria-label="Mở menu" aria-haspopup="dialog" onClick={() => setLoaded(true)}><Menu size={23} strokeWidth={1.5} /></button>;
}
export function SearchOverlayLoader() {
  const [loaded, setLoaded] = useState(false);
  return loaded ? <SearchPanel initiallyOpen /> : <button type="button" className="shop-icon-button" aria-label="Mở tìm kiếm" aria-haspopup="dialog" onClick={() => setLoaded(true)}><Search size={20} strokeWidth={1.5} /></button>;
}
