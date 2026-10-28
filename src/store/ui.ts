"use client";

import { create } from "zustand";

export const useUiStore = create<{ cartOpen: boolean; setCartOpen: (open: boolean) => void }>((set) => ({ cartOpen: false, setCartOpen: (cartOpen) => set({ cartOpen }) }));
