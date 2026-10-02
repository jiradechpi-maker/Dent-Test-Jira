import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/** Label + control + hint/error, wired for accessibility via ids. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-danger" aria-hidden>*</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[11px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
