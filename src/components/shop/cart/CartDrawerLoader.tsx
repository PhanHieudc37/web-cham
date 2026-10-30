"use client";
import dynamic from "next/dynamic";
import { useUiStore } from "@/store/ui";
const Drawer = dynamic(() => import("./CartDrawer").then((module) => module.CartDrawer), { ssr: false });
export function CartDrawerLoader() {
  const loaded = useUiStore((state) => state.cartLoaded);
  return loaded ? <Drawer /> : null;
}
