"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog as DialogPrimitive } from "radix-ui";
import { CornerDownLeft, Languages, PanelLeft, Search } from "lucide-react";
import { NAV_GROUPS } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { useUiStore } from "@/stores/ui-store";
import { useLocale, useSetLocale, useT } from "@/components/i18n/locale-provider";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
        return;
      }
      if (event.key === "[" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen, toggleSidebar]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-[2px] animate-fade-in" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[14vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[var(--radius-modal)] border border-border bg-card shadow-[var(--shadow-lg)] outline-none animate-fade-in"
        >
          <DialogPrimitive.Title className="sr-only">{t("ค้นหาและคำสั่ง", "Search and commands")}</DialogPrimitive.Title>
          <Command label={t("ค้นหาและคำสั่ง", "Search and commands")} loop className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-neutral-400" aria-hidden />
              <Command.Input
                autoFocus
                placeholder={t("พิมพ์ชื่อเมนูหรือคำสั่ง เช่น หนังสือเชิญ, จับเวลา…", "Type a menu or command, e.g. invitation, timer…")}
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2 scrollbar-thin">
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">{t("ไม่พบเมนูที่ค้นหา", "No matching menu")}</Command.Empty>
              {NAV_GROUPS.map((group) => (
                <Command.Group
                  key={group.label.en}
                  heading={t(group.label)}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-neutral-400"
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.id}
                        value={`${item.label.th} ${item.label.en} ${item.description.th} ${item.description.en} ${(item.keywords ?? []).join(" ")}`}
                        onSelect={() => run(() => router.push(item.href))}
                        className="group flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 text-[13px] data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-900"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-neutral-500 group-data-[selected=true]:border-brand-200 group-data-[selected=true]:text-brand-700">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{t(item.label)}</span>
                          <span className="block truncate text-xs text-muted-foreground">{t(item.description)}</span>
                        </span>
                        {item.status === "planned" ? <Badge>Phase {item.phase}</Badge> : null}
                        <CornerDownLeft className="size-3.5 text-neutral-400 opacity-0 group-data-[selected=true]:opacity-100" aria-hidden />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
              <Command.Group
                heading={t("คำสั่ง", "Commands")}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-neutral-400"
              >
                <Command.Item
                  value="ย่อ ขยาย แถบเมนู sidebar toggle" // i18n-exempt: search keywords in both languages
                  onSelect={() => run(toggleSidebar)}
                  className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 text-[13px] data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-900"
                >
                  <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-neutral-500">
                    <PanelLeft className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1 font-medium">{t("ย่อ / ขยายแถบเมนู", "Collapse / expand sidebar")}</span>
                  <Kbd>[</Kbd>
                </Command.Item>
                <Command.Item
                  value="language ภาษา english thai อังกฤษ ไทย switch เปลี่ยนภาษา" // i18n-exempt: search keywords
                  onSelect={() => run(() => setLocale(locale === "th" ? "en" : "th"))}
                  className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 text-[13px] data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-900"
                >
                  <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-neutral-500">
                    <Languages className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1 font-medium">{locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
