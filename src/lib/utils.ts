import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Platform-aware label for the primary modifier key (⌘ on Apple, Ctrl elsewhere). */
export function modKeyLabel(): string {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
}
