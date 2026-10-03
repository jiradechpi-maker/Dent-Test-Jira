"use client";

import { useRef, useState } from "react";
import { CheckCircle2, CircleAlert, CloudOff, ExternalLink, FileUp, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SourceKey } from "@/config/data-sources";
import type { Bi } from "@/lib/i18n/locale";
import { SourceError, type SourceResult, type SyncMode } from "@/lib/schedule/bundle";
import { stamp, timeAgo } from "@/lib/schedule/format";
import { useT } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

const MODE_LABEL: Record<SyncMode, Bi> = {
  "service-account": { th: "ซิงก์อัตโนมัติจาก Google Drive", en: "Auto-synced from Google Drive" },
  public: { th: "ซิงก์จากลิงก์สาธารณะ", en: "Synced from a public link" },
  upload: { th: "จากไฟล์ที่อัปโหลด (ไม่อัปเดตเอง)", en: "From an uploaded file (not updated automatically)" },
};

/** One-line status of a synced file: where it comes from, when it last changed, and a way to open it. */
export function SourceStatus<T>({ result }: { result: SourceResult<T> | undefined }) {
  const t = useT();
  if (!result) return null;
  if (!result.ok) {
    return (
      <Badge tone="danger" className="h-6">
        <CloudOff aria-hidden /> {t(result.label)}: {t("เชื่อมต่อไม่ได้", "cannot connect")}
      </Badge>
    );
  }
  const { source } = result;
  const now = Date.now();
  const changed = source.modifiedTime
    ? t(
        `แก้ไขล่าสุด ${timeAgo(source.modifiedTime, now, "th")}${source.modifiedBy ? ` โดย ${source.modifiedBy}` : ""}`,
        `Last edited ${timeAgo(source.modifiedTime, now, "en")}${source.modifiedBy ? ` by ${source.modifiedBy}` : ""}`,
      )
    : null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <Tooltip
        content={t(
          `ตรวจล่าสุด ${stamp(source.checkedAt, "th")} · ดาวน์โหลดล่าสุด ${stamp(source.fetchedAt, "th")}`,
          `Last checked ${stamp(source.checkedAt, "en")} · last downloaded ${stamp(source.fetchedAt, "en")}`,
        )}
      >
        <Badge tone={source.mode === "upload" ? "warning" : "success"} className="h-6">
          {source.mode === "upload" ? <FileUp aria-hidden /> : <CheckCircle2 aria-hidden />}
          {t(MODE_LABEL[source.mode])}
        </Badge>
      </Tooltip>
      {changed ? (
        <span>{changed}</span>
      ) : (
        <span>{t(`อ่านไฟล์ ${timeAgo(source.fetchedAt, now, "th")}`, `Loaded ${timeAgo(source.fetchedAt, now, "en")}`)}</span>
      )}
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
        >
          {t("เปิดไฟล์ต้นฉบับ", "Open source file")} <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

export function RefreshButton({ onRefresh, refreshing }: { onRefresh: () => Promise<void>; refreshing: boolean }) {
  const t = useT();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        onRefresh().catch(() => toast.error(t("ซิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง", "Sync failed. Please try again.")));
      }}
      disabled={refreshing}
    >
      <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
      {refreshing ? t("กำลังซิงก์…", "Syncing…") : t("ซิงก์เดี๋ยวนี้", "Sync now")}
    </Button>
  );
}

/**
 * Shown when Drive cannot be read: explains the one-time setup (share the file as Viewer with the
 * service account) and offers a manual .xlsx upload meanwhile. `label` and `error` come from the server
 * in both languages.
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
  label: Bi;
  url: string;
  error: Bi;
  serviceAccountEmail: string | null;
  onUpload: (key: SourceKey, file: File) => Promise<void>;
}) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const emailChip = serviceAccountEmail ? (
    <code className="rounded bg-card px-1 py-0.5 text-xs select-all">{serviceAccountEmail}</code>
  ) : null;

  return (
    <Card className="border-warning/30 bg-warning-bg/40 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-neutral-900">
            {t(`ยังอ่าน “${label.th}” จาก Google Drive ไม่ได้`, `Cannot read “${label.en}” from Google Drive yet`)}
          </h2>
          <p className="mt-1 text-xs break-words text-muted-foreground">{t(error)}</p>

          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] text-neutral-700">
            {emailChip && t.locale === "th" ? (
              <li>
                เปิด
                <a href={url} target="_blank" rel="noreferrer" className="mx-1 font-medium text-brand-700 hover:underline">
                  ไฟล์ต้นฉบับ
                </a>
                → กด <b>แชร์</b> → เพิ่มอีเมล {emailChip} เป็น{" "}
                <b>ผู้มีสิทธิ์อ่าน (Viewer)</b> · ไม่ต้องให้สิทธิ์แก้ไข
              </li>
            ) : emailChip ? (
              <li>
                Open the
                <a href={url} target="_blank" rel="noreferrer" className="mx-1 font-medium text-brand-700 hover:underline">
                  source file
                </a>
                → click <b>Share</b> → add {emailChip} as a <b>Viewer</b> · no edit access needed
              </li>
            ) : t.locale === "th" ? (
              <li>
                ผู้ดูแลระบบตั้งค่า service account ของ Google (ดูขั้นตอนใน README หัวข้อ “เชื่อม Google Drive”) แล้วนำอีเมลของ service
                account ไปแชร์ไฟล์เป็น <b>Viewer</b>
              </li>
            ) : (
              <li>
                An administrator sets up a Google service account (see the README section “เชื่อม Google Drive” — Connecting Google
                Drive), then shares the file with the service account&apos;s email as a <b>Viewer</b>
              </li>
            )}
            <li>
              {t(
                "กด “ซิงก์เดี๋ยวนี้” — หลังจากนั้นระบบจะตรวจการแก้ไขในไฟล์ให้เองทุก 2 นาที",
                "Click “Sync now” — after that, the system checks the file for edits every 2 minutes",
              )}
            </li>
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
                  .then(() => toast.success(t(`อ่าน ${file.name} แล้ว`, `Loaded ${file.name}`)))
                  .catch((reason: unknown) =>
                    toast.error(
                      reason instanceof SourceError
                        ? t(reason.text)
                        : reason instanceof Error
                          ? reason.message
                          : t("อ่านไฟล์ไม่สำเร็จ", "Could not read the file"),
                    ),
                  )
                  .finally(() => setBusy(false));
              }}
            />
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              <FileUp aria-hidden /> {busy ? t("กำลังอ่าน…", "Reading…") : t("ระหว่างนี้: อัปโหลดไฟล์ .xlsx เอง", "Meanwhile: upload the .xlsx yourself")}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {t("ใน Google Sheets: ไฟล์ → ดาวน์โหลด → Microsoft Excel (.xlsx)", "In Google Sheets: File → Download → Microsoft Excel (.xlsx)")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ClearUploadButton({ onClear }: { onClear: () => void }) {
  const t = useT();
  return (
    <Button variant="ghost" size="sm" onClick={onClear}>
      <Trash2 aria-hidden /> {t("ล้างไฟล์ที่อัปโหลด", "Clear uploaded file")}
    </Button>
  );
}
