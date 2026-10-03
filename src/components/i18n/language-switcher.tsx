"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";
import { useLocale, useSetLocale } from "./locale-provider";

const OPTIONS: { value: Locale; short: string; name: string }[] = [
  { value: "th", short: "TH", name: "ภาษาไทย" }, // i18n-exempt: a language is named in its own language
  { value: "en", short: "EN", name: "English" },
];

/** "TH | EN" — language names in their own language, no flags (a language is not a country). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();
  return (
    <div role="group" aria-label="Language / ภาษา" className={cn("flex items-center gap-1", className)}>
      <Languages className="size-3.5 text-neutral-400" aria-hidden />
      <div className="inline-flex rounded-[var(--radius-control)] bg-neutral-100 p-0.5">
        {OPTIONS.map((option) => {
          const selected = option.value === locale;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              lang={option.value}
              title={option.name}
              aria-label={`${option.short} – ${option.name}`}
              onClick={() => !selected && setLocale(option.value)}
              className={cn(
                "h-6 cursor-pointer rounded-[6px] px-2 font-[family-name:var(--font-latin)] text-[11px] font-semibold tracking-wide transition-colors outline-none focus-visible:shadow-[var(--shadow-focus)]",
                selected ? "bg-card text-neutral-900 shadow-[var(--shadow-sm)]" : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              {option.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
