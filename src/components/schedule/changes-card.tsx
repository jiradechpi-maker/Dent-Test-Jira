"use client";

import { useState } from "react";
import { ArrowRight, BellDot, Check, Minus, Plus } from "lucide-react";
import type { Change } from "@/lib/schedule/diff";
import { stamp } from "@/lib/schedule/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PREVIEW = 6;

/** "What changed in the sheet since you last looked", with one button to mark it as seen. */
export function ChangesCard({ changes, since, onAcknowledge }: { changes: Change[]; since: string | null; onAcknowledge: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (changes.length === 0) return null;
  const visible = expanded ? changes : changes.slice(0, PREVIEW);

  return (
    <Card className="border-brand-200">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <BellDot className="size-4 text-brand-600" aria-hidden /> มีการเปลี่ยนแปลง {changes.length} รายการ
          </CardTitle>
          <CardDescription>เทียบกับครั้งล่าสุดที่กดรับทราบ{since ? ` (${stamp(since)})` : ""}</CardDescription>
        </div>
        <Button size="sm" onClick={onAcknowledge}>
          <Check aria-hidden /> รับทราบ
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border text-[13px]">
          {visible.map((change) => (
            <li key={change.key} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="w-16 shrink-0">
                {change.kind === "changed" ? (
                  <Badge tone="warning">เปลี่ยน</Badge>
                ) : change.kind === "added" ? (
                  <Badge tone="success">
                    <Plus aria-hidden /> ใหม่
                  </Badge>
                ) : (
                  <Badge tone="danger">
                    <Minus aria-hidden /> ลบออก
                  </Badge>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-neutral-800" title={change.label}>
                {change.label}
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground tabular">
                {change.before ? <span className={change.kind === "changed" ? "line-through" : undefined}>{change.before}</span> : null}
                {change.kind === "changed" ? <ArrowRight className="size-3" aria-hidden /> : null}
                {change.after ? <span className="font-medium text-neutral-800">{change.after}</span> : null}
              </span>
            </li>
          ))}
        </ul>
        {changes.length > PREVIEW ? (
          <Button variant="link" size="sm" className="mt-2" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "ย่อรายการ" : `ดูทั้งหมด ${changes.length} รายการ`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
