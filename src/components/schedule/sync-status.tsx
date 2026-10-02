"use client";

import { useRef, useState } from "react";
import { CheckCircle2, CircleAlert, CloudOff, ExternalLink, FileUp, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SourceKey } from "@/config/data-sources";
import type { SourceResult } from "@/lib/schedule/bundle";
import { stamp, timeAgo } from "@/lib/schedule/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

const MODE_LABEL = {
  "service-account": "ซิงก์อัตโนมัติจาก Google Drive",
  public: "ซิงก์จากลิงก์สาธารณะ",
  upload: "จากไฟล์ที่อัปโหลด (ไม่อัปเดตเอง)",
} as const;

/** One-line status of a synced file: where it comes from, when it last changed, and a way to open it. */
export function SourceStatus<T>({ result }: { result: SourceResult<T> | undefined }) {
  if (!result) return null;
  if (!result.ok) {
    return (
      <Badge tone="danger" className="h-6">
        <CloudOff aria-hidden /> {result.label}: เชื่อมต่อไม่ได้
      </Badge>
    );
  }
  const { source } = result;
  const changed = source.modifiedTime ? `แก้ไขล่าสุด ${timeAgo(source.modifiedTime)}${source.modifiedBy ? ` โดย ${source.modifiedBy}` : ""}` : null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <Tooltip content={`ตรวจล่าสุด ${stamp(source.checkedAt)} · ดาวน์โหลดล่าสุด ${stamp(source.fetchedAt)}`}>
        <Badge tone={source.mode === "upload" ? "warning" : "success"} className="h-6">
          {source.mode === "upload" ? <FileUp aria-hidden /> : <CheckCircle2 aria-hidden />}
          {MODE_LABEL[source.mode]}
        </Badge>
      </Tooltip>
      {changed ? <span>{changed}</span> : <span>อ่านไฟล์ {timeAgo(source.fetchedAt)}</span>}
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
        >
          เปิดไฟล์ต้นฉบับ <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

export function RefreshButton({ onRefresh, refreshing }: { onRefresh: () => Promise<void>; refreshing: boolean }) {
  return (
    <Button
      variant="secondary"
      onClick={() => {
        onRefresh().catch(() => toast.error("ซิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง"));
      }}
      disabled={refreshing}
    >
      <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
      {refreshing ? "กำลังซิงก์…" : "ซิงก์เดี๋ยวนี้"}
    </Button>
  );
}

/**
 * Shown when Drive cannot be read: explains the one-time setup (share the file as Viewer with the
 * service account) and offers a manual .xlsx upload meanwhile.
 */
export function SourceSetupCard({
  sourceKey,
  label,
  url,
  error,
  serviceAccountEmail,
  onUpload,
}: {
  sourceKey: SourceKey;
  label: string;
  url: string;
  error: string;
  serviceAccountEmail: string | null;
  onUpload: (key: SourceKey, file: File) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Card className="border-warning/30 bg-warning-bg/40 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-neutral-900">ยังอ่าน “{label}” จาก Google Drive ไม่ได้</h2>
          <p className="mt-1 text-xs break-words text-muted-foreground">{error}</p>

          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] text-neutral-700">
            {serviceAccountEmail ? (
              <li>
                เปิด
                <a href={url} target="_blank" rel="noreferrer" className="mx-1 font-medium text-brand-700 hover:underline">
                  ไฟล์ต้นฉบับ
                </a>
                → กด <b>แชร์</b> → เพิ่มอีเมล <code className="rounded bg-card px-1 py-0.5 text-xs select-all">{serviceAccountEmail}</code> เป็น{" "}
                <b>ผู้มีสิทธิ์อ่าน (Viewer)</b> · ไม่ต้องให้สิทธิ์แก้ไข
              </li>
            ) : (
              <li>
                ผู้ดูแลระบบตั้งค่า service account ของ Google (ดูขั้นตอนใน README หัวข้อ “เชื่อม Google Drive”) แล้วนำอีเมลของ service
                account ไปแชร์ไฟล์เป็น <b>Viewer</b>
              </li>
            )}
            <li>กด “ซิงก์เดี๋ยวนี้” — หลังจากนั้นระบบจะตรวจการแก้ไขในไฟล์ให้เองทุก 2 นาที</li>
          </ol>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              ref={input}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setBusy(true);
                onUpload(sourceKey, file)
                  .then(() => toast.success(`อ่าน ${file.name} แล้ว`))
                  .catch((reason: unknown) => toast.error(reason instanceof Error ? reason.message : "อ่านไฟล์ไม่สำเร็จ"))
                  .finally(() => setBusy(false));
              }}
            />
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              <FileUp aria-hidden /> {busy ? "กำลังอ่าน…" : "ระหว่างนี้: อัปโหลดไฟล์ .xlsx เอง"}
            </Button>
            <span className="text-[11px] text-muted-foreground">ใน Google Sheets: ไฟล์ → ดาวน์โหลด → Microsoft Excel (.xlsx)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ClearUploadButton({ onClear }: { onClear: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClear}>
      <Trash2 aria-hidden /> ล้างไฟล์ที่อัปโหลด
    </Button>
  );
}
