"use client";

import { useState } from "react";
import { ArrowRight, BellDot, Check, Minus, Plus } from "lucide-react";
import type { Change } from "@/lib/schedule/diff";
import { stamp } from "@/lib/schedule/format";
import { useT } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PREVIEW = 6;

/** "What changed in the sheet since you last looked", with one button to mark it as seen. */
export function ChangesCard({ changes, since, onAcknowledge }: { changes: Change[]; since: string | null; onAcknowledge: () => void }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  if (changes.length === 0) return null;
  const visible = expanded ? changes : changes.slice(0, PREVIEW);
  const count = changes.length;

  return (
    <Card className="border-brand-200">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <BellDot className="size-4 text-brand-600" aria-hidden />{" "}
            {t(`มีการเปลี่ยนแปลง ${count} รายการ`, `${count} ${count === 1 ? "change" : "changes"}`)}
          </CardTitle>
          <CardDescription>
            {t(
              `เทียบกับครั้งล่าสุดที่กดรับทราบ${since ? ` (${stamp(since, "th")})` : ""}`,
              `Since you last clicked “Mark as seen”${since ? ` (${stamp(since, "en")})` : ""}`,
            )}
          </CardDescription>
        </div>
        <Button size="sm" onClick={onAcknowledge}>
          <Check aria-hidden /> {t("รับทราบ", "Mark as seen")}
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border text-[13px]">
          {visible.map((change) => (
            <li key={change.key} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
              <span className={cn("shrink-0", t.locale === "th" ? "w-16" : "w-20")}>
                {change.kind === "changed" ? (
                  <Badge tone="warning">{t("เปลี่ยน", "Changed")}</Badge>
                ) : change.kind === "added" ? (
                  <Badge tone="success">
                    <Plus aria-hidden /> {t("ใหม่", "New")}
                  </Badge>
                ) : (
                  <Badge tone="danger">
                    <Minus aria-hidden /> {t("ลบออก", "Removed")}
                  </Badge>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-neutral-800" title={t(change.label)}>
                {t(change.label)}
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground tabular">
                {change.before ? <span className={change.kind === "changed" ? "line-through" : undefined}>{t(change.before)}</span> : null}
                {change.kind === "changed" ? <ArrowRight className="size-3" aria-hidden /> : null}
                {change.after ? <span className="font-medium text-neutral-800">{t(change.after)}</span> : null}
              </span>
            </li>
          ))}
        </ul>
        {count > PREVIEW ? (
          <Button variant="link" size="sm" className="mt-2" onClick={() => setExpanded((value) => !value)}>
            {expanded ? t("ย่อรายการ", "Show fewer") : t(`ดูทั้งหมด ${count} รายการ`, `Show all ${count}`)}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
