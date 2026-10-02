import * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-neutral-200 bg-neutral-50 px-1 font-[family-name:var(--font-latin)] text-[10px] font-medium text-neutral-500",
        className,
      )}
      {...props}
    />
  );
}
