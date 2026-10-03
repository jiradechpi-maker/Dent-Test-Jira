import { useId } from "react";
import { cn } from "@/lib/utils";

/** The tooth outline from the C · Check app icon (public/brand/icons/check), on a 100 × 120 grid. */
const TOOTH =
  "M0 34C0 10 16 0 30 1C40 2 44 8 50 8C56 8 60 2 70 1C84 0 100 10 100 34C100 56 92 68 88 82C84 98 84 118 72 119C60 120 60 98 55 90C53 86 47 86 45 90C40 98 40 120 28 119C16 118 16 98 12 82C8 68 0 56 0 34Z";

/** Dentboard's mark: a purple tooth with a white check — the same drawing as the browser-tab icon. */
export function DentboardMark({ className, title }: { className?: string; title?: string }) {
  const gradient = `dentboard-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="-4 -4 108 128" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B3FE0" />
          <stop offset="1" stopColor="#4F0080" />
        </linearGradient>
      </defs>
      <path d={TOOTH} fill={`url(#${gradient})`} />
      <path d="M30 40L45 54L72 26" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
