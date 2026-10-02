"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      setCommandOpen: (open) => set({ commandOpen: open }),
    }),
    {
      name: "dentops.ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
      // Rehydrated in AppShell after mount, so server and first client render match.
      skipHydration: true,
    },
  ),
);
