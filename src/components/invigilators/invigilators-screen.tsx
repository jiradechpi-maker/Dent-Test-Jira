"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Users } from "lucide-react";
import { INVIGILATORS } from "@/config/master-data";
import { mediumDay, timeSpan } from "@/lib/schedule/format";
import { invigilatorLoads } from "@/lib/schedule/load";
import { todayInBangkok } from "@/lib/thai";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ClearUploadButton, RefreshButton, SourceSetupCard, SourceStatus } from "@/components/schedule/sync-status";
import { useScheduleBundle } from "@/components/schedule/use-schedule";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const B55 = new Set(INVIGILATORS.filter((person) => person.priority).map((person) => person.nickname));

export function InvigilatorsScreen() {
  const { query, invigilation, refresh, refreshing, upload, clearUpload, hasUpload, serviceAccountEmail } = useScheduleBundle();
  const [today] = useState(() => todayInBangkok());
  const [selected, setSelected] = useState<string | null>(null);
  const book = invigilation?.ok ? invigilation.data : null;
  const loads = useMemo(() => (book ? invigilatorLoads(book) : []), [book]);
  const max = Math.max(1, ...loads.map((load) => load.total));
  const average = loads.length ? loads.reduce((sum, load) => sum + load.total, 0) / loads.length : 0;
  const person = loads.find((load) => load.name === selected) ?? null;

  return (
    <PageContainer>
      <PageHeader
        icon={Users}
        title="ชั่วโมงคุมสอบ"
        description="เรียงจากชั่วโมงน้อยไปมาก — คนบนสุดควรได้รับมอบหมายก่อนเพื่อให้ภาระเท่ากัน"
        actions={<RefreshButton onRefresh={refresh} refreshing={refreshing} />}
        className="mb-3"
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SourceStatus result={invigilation} />
        {hasUpload.invigilation && invigilation?.ok && invigilation.source.mode === "upload" ? (
          <ClearUploadButton onClear={() => clearUpload("invigilation")} />
        ) : null}
      </div>

      {query.isPending && !invigilation ? <Skeleton className="h-96 w-full" /> : null}
      {invigilation && !invigilation.ok ? (
        <SourceSetupCard
          sourceKey="invigilation"
          label={invigilation.label}
          url={invigilation.url}
          error={invigilation.error}
          serviceAccountEmail={serviceAccountEmail}
          onUpload={upload}
        />
      ) : null}

      {book ? (
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>ชั่วโมงสะสมรายบุคคล</CardTitle>
                <CardDescription>
                  สีเข้ม = นับแล้วในแท็บ “{book.summary?.sheet ?? "สรุป"}” · สีอ่อน = จัดไว้ในแท็บรายเดือนแต่ยังไม่ลงแท็บสรุป · เฉลี่ย{" "}
                  {average.toFixed(1)} ชม.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1">
                {loads.map((load) => (
                  <li key={load.name}>
                    <button
                      type="button"
                      onClick={() => setSelected((value) => (value === load.name ? null : load.name))}
                      className={cn(
                        "grid w-full cursor-pointer grid-cols-[88px_1fr_64px] items-center gap-3 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-neutral-50",
                        selected === load.name && "bg-brand-50",
                      )}
                    >
                      <span className="truncate font-medium text-neutral-800">
                        {load.name}
                        {B55.has(load.name) ? <span className="ml-1 text-[10px] text-brand-600">ตึก 55</span> : null}
                      </span>
                      <span className="flex h-3 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
                        <span className="bg-brand-600" style={{ width: `${(load.recorded / max) * 100}%` }} />
                        <span className="bg-brand-300" style={{ width: `${(load.planned / max) * 100}%` }} />
                      </span>
                      <span className="text-right tabular text-neutral-700">
                        {load.total} <span className="text-[11px] text-muted-foreground">ชม.</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{person ? `งานที่จัดให้ ${person.name}` : "เลือกชื่อเพื่อดูงานที่จัดไว้"}</CardTitle>
                  <CardDescription>
                    {person ? `นับแล้ว ${person.recorded} ชม. · ยังไม่ลงแท็บสรุป ${person.planned} ชม.` : "งานที่ยังไม่ได้นับในแท็บสรุป"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {person ? (
                  person.pending.length ? (
                    <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border text-[13px]">
                      {person.pending.map((entry) => (
                        <li key={entry.id} className={cn("px-3 py-2", entry.date && entry.date < today && "text-neutral-400")}>
                          <p className="font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground tabular">
                            {entry.date ? mediumDay(entry.date) : "ยังไม่มีวัน"} · {timeSpan(entry.start, entry.end)} · {entry.rooms.join(", ") || "ยังไม่มีห้อง"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">ไม่มีงานค้างนอกแท็บสรุป</p>
                  )
                ) : null}
              </CardContent>
            </Card>

            {book.summary?.warnings.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CircleAlert className="size-4 text-warning" aria-hidden /> จุดที่ควรแก้ในชีต
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1.5 text-[13px] text-neutral-700">
                    {book.summary.warnings.map((warning) => (
                      <li key={warning} className="flex gap-2">
                        <Badge tone="warning">ตรวจ</Badge>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
