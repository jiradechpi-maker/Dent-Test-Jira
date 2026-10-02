import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "flex h-8 w-full min-w-0 rounded-[var(--radius-control)] border border-input bg-card px-2.5 text-[13px] text-neutral-900 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-neutral-400 hover:border-neutral-300 focus-visible:border-brand-500 focus-visible:shadow-[var(--shadow-focus)] disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus-visible:shadow-[0_0_0_3px_rgba(194,37,92,.15)]";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(inputClass, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputClass, "h-auto min-h-16 py-1.5 leading-relaxed", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <span className="relative flex w-full min-w-0">
      <select ref={ref} className={cn(inputClass, "cursor-pointer appearance-none pr-7", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-neutral-500" />
    </span>
  ),
);
NativeSelect.displayName = "NativeSelect";
