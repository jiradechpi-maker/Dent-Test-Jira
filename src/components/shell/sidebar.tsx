"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { NAV_GROUPS, findNavItem, type NavItem } from "@/config/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useT } from "@/components/i18n/locale-provider";

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  const t = useT();
  const label = t(item.label);
  return (
    <Tooltip content={label} side="right" disabled={!collapsed}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? label : undefined}
        className={cn(
          "group flex h-8 items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,.45)]",
          active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
          collapsed && "justify-center px-0",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-white/60 group-hover:text-white")} aria-hidden />
        {!collapsed && (
          <>
            <span className="truncate">{label}</span>
            {item.status === "planned" ? (
              <span className="ml-auto rounded-full bg-white/10 px-1.5 py-px text-[10px] font-medium text-white/55">P{item.phase}</span>
            ) : null}
          </>
        )}
      </Link>
    </Tooltip>
  );
}

export function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeId = findNavItem(pathname)?.id;
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const t = useT();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-[var(--spacing-topbar)] shrink-0 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-white/30">
          <Image src="/brand/kmitl-emblem.jpeg" alt={t("ตรา สจล.", "KMITL emblem")} width={28} height={28} priority />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="font-[family-name:var(--font-latin)] text-[13px] font-semibold tracking-tight text-white">Dentboard</p>
            <p className="truncate text-[10.5px] text-white/60">{t("คณะทันตแพทยศาสตร์ สจล.", "Faculty of Dentistry, KMITL")}</p>
          </div>
        )}
      </div>

      <div className={cn("px-3 pb-2", collapsed && "px-2")}>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            setCommandOpen(true);
          }}
          aria-label={t("ค้นหาและคำสั่ง", "Search and commands")}
          className={cn(
            "flex h-8 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-control)] bg-white/8 px-2.5 text-[12.5px] text-white/60 outline-none transition-colors hover:bg-white/12 hover:text-white focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,.45)]",
            collapsed && "justify-center px-0",
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden />
          {!collapsed && (
            <>
              <span>{t("ค้นหา…", "Search…")}</span>
              <Kbd className="ml-auto border-white/15 bg-white/10 text-white/70">⌘K</Kbd>
            </>
          )}
        </button>
      </div>

      <nav aria-label={t("เมนูหลัก", "Main menu")} className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin [scrollbar-color:rgba(255,255,255,.2)_transparent]">
        {NAV_GROUPS.map((group) => (
          <div key={group.label.en} className="mt-3 first:mt-1">
            {!collapsed ? (
              <p className="px-2.5 pb-1 text-[10.5px] font-semibold tracking-wide text-white/40 uppercase">{t(group.label)}</p>
            ) : (
              <div className="mx-auto mb-1 h-px w-6 bg-white/10" />
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavLink item={item} active={item.id === activeId} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const t = useT();

  return (
    <aside
      className={cn(
        "sidebar-gradient relative hidden h-dvh shrink-0 flex-col transition-[width] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] lg:flex print:hidden",
        collapsed ? "w-[var(--spacing-sidebar-collapsed)]" : "w-[var(--spacing-sidebar)]",
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <div className={cn("border-t border-white/10 p-3", collapsed && "px-2")}>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? t("ขยายแถบเมนู", "Expand sidebar") : t("ย่อแถบเมนู", "Collapse sidebar")}
          aria-expanded={!collapsed}
          className={cn(
            "flex h-8 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-[12.5px] text-white/60 outline-none transition-colors hover:bg-white/8 hover:text-white focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,.45)]",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <ChevronsLeft className="size-4" aria-hidden />}
          {!collapsed && <span>{t("ย่อเมนู", "Collapse")}</span>}
          {!collapsed && <Kbd className="ml-auto border-white/15 bg-white/10 text-white/70">[</Kbd>}
        </button>
      </div>
    </aside>
  );
}
