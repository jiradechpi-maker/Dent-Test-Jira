"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-card px-3 py-2 text-sm shadow-[var(--shadow-md)] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        ข้ามไปยังเนื้อหา
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none scrollbar-thin">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
