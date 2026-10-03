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
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SidebarContent } from "./sidebar";

/** Bangkok wall time. English adds the zone (ICT, UTC+7) for colleagues outside Thailand. */
function BangkokClock() {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return <span className="h-4 w-36" aria-hidden />;
  const text = new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return (
    <time
      dateTime={now.toISOString()}
      title={locale === "th" ? "เวลาประเทศไทย (UTC+7)" : "Bangkok time, Indochina Time (UTC+7)"}
      className="hidden text-xs text-neutral-500 tabular md:inline"
    >
      {locale === "th" ? `${text} น.` : `${text} ICT`}
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
  const t = useT();
  useEffect(() => setMod(modKeyLabel()), []);

  return (
    <header className="sticky top-0 z-30 flex h-[var(--spacing-topbar)] shrink-0 items-center gap-2 border-b border-border bg-card/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/75 sm:px-5 print:hidden">
      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Trigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("เปิดเมนู", "Open menu")}>
            <Menu />
          </Button>
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-neutral-900/40 animate-fade-in lg:hidden" />
          <DialogPrimitive.Content className="sidebar-gradient fixed inset-y-0 left-0 z-50 w-[var(--spacing-sidebar)] shadow-[var(--shadow-lg)] outline-none lg:hidden">
            <DialogPrimitive.Title className="sr-only">{t("เมนูหลัก", "Main menu")}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">{t("เลือกโมดูลที่ต้องการใช้งาน", "Choose a module")}</DialogPrimitive.Description>
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
              {t(current.label)}
            </span>
          </>
        ) : null}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <BangkokClock />
        <LanguageSwitcher />
        <Button
          variant="secondary"
          size="md"
          onClick={() => setCommandOpen(true)}
          className="w-9 justify-center px-0 text-neutral-500 sm:w-48 sm:justify-start sm:px-2.5 xl:w-56"
          aria-label={t("ค้นหาและคำสั่ง", "Search and commands")}
        >
          <Search aria-hidden />
          <span className="hidden truncate sm:inline">{t("ค้นหาเมนู คำสั่ง…", "Search menus…")}</span>
          <Kbd className="ml-auto hidden shrink-0 sm:inline-flex">{mod}K</Kbd>
        </Button>
      </div>
    </header>
  );
}
