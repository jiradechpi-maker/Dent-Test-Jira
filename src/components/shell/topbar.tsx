"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, Search } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { findNavItem } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { modKeyLabel } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { SidebarContent } from "./sidebar";

function BangkokClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return <span className="h-4 w-36" aria-hidden />;
  const text = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return (
    <time dateTime={now.toISOString()} className="hidden text-xs text-neutral-500 tabular md:inline">
      {text} น.
    </time>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const [mod, setMod] = useState("⌘");
  useEffect(() => setMod(modKeyLabel()), []);

  return (
    <header className="sticky top-0 z-30 flex h-[var(--spacing-topbar)] shrink-0 items-center gap-2 border-b border-border bg-card/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/75 sm:px-5 print:hidden">
      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Trigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="เปิดเมนู">
            <Menu />
          </Button>
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-neutral-900/40 animate-fade-in lg:hidden" />
          <DialogPrimitive.Content className="sidebar-gradient fixed inset-y-0 left-0 z-50 w-[var(--spacing-sidebar)] shadow-[var(--shadow-lg)] outline-none lg:hidden">
            <DialogPrimitive.Title className="sr-only">เมนูหลัก</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">เลือกโมดูลที่ต้องการใช้งาน</DialogPrimitive.Description>
            <SidebarContent collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <Link href="/" className="rounded text-neutral-500 outline-none transition-colors hover:text-neutral-800 focus-visible:shadow-[var(--shadow-focus)]">
          DentOps
        </Link>
        {current && current.href !== "/" ? (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-neutral-300" aria-hidden />
            <span className="truncate font-medium text-neutral-900" aria-current="page">
              {current.label}
            </span>
          </>
        ) : null}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <BangkokClock />
        <Button
          variant="secondary"
          size="md"
          onClick={() => setCommandOpen(true)}
          className="w-9 justify-center px-0 text-neutral-500 sm:w-56 sm:justify-start sm:px-2.5"
          aria-label="ค้นหาและคำสั่ง"
        >
          <Search aria-hidden />
          <span className="hidden sm:inline">ค้นหาเมนู คำสั่ง…</span>
          <Kbd className="ml-auto hidden sm:inline-flex">{mod}K</Kbd>
        </Button>
      </div>
    </header>
  );
}
