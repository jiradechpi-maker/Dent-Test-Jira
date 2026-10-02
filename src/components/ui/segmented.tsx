"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

/** Compact radio-group styled as a segmented control (Linear-style). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    const option = options[next];
    if (option) {
      onChange(option.value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex rounded-[var(--radius-control)] bg-neutral-100 p-0.5", className)}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "flex-1 cursor-pointer rounded-[6px] px-3 font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 outline-none focus-visible:shadow-[var(--shadow-focus)]",
              size === "lg" ? "h-9 text-sm" : "h-7 text-xs",
              selected ? "bg-card text-neutral-900 shadow-[var(--shadow-sm)]" : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
