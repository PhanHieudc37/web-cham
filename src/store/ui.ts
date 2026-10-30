"use client";

import { create } from "zustand";

export const useUiStore = create<{ cartOpen: boolean; cartLoaded: boolean; setCartOpen: (open: boolean) => void }>((set) => ({ cartOpen: false, cartLoaded: false, setCartOpen: (cartOpen) => set((state) => ({ cartOpen, cartLoaded: state.cartLoaded || cartOpen })) }));
