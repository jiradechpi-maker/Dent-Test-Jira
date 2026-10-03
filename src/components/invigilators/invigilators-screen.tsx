"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Users } from "lucide-react";
import { INVIGILATORS, RESIGNED_INVIGILATORS } from "@/config/master-data";
import { formatHoursShort } from "@/lib/i18n/dates";
import { mediumDay, timeSpan } from "@/lib/schedule/format";
import { invigilatorLoads, missingFromSummary } from "@/lib/schedule/load";
import { todayInBangkok } from "@/lib/thai";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ClearUploadButton, RefreshButton, SourceSetupCard, SourceStatus } from "@/components/schedule/sync-status";
import { useScheduleBundle } from "@/components/schedule/use-schedule";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/i18n/locale-provider";

const B55 = new Set(INVIGILATORS.filter((person) => person.priority).map((person) => person.nickname));

export function InvigilatorsScreen() {
  const { query, invigilation, refresh, refreshing, upload, clearUpload, hasUpload, serviceAccountEmail } = useScheduleBundle();
  const t = useT();
  const locale = t.locale;
  const [today] = useState(() => todayInBangkok());
  const [selected, setSelected] = useState<string | null>(null);
  const book = invigilation?.ok ? invigilation.data : null;
  const allLoads = useMemo(() => (book ? invigilatorLoads(book, today) : []), [book, today]);
  const missing = useMemo(() => missingFromSummary(allLoads), [allLoads]);
  const loads = allLoads.filter((load) => !RESIGNED_INVIGILATORS.includes(load.name));
  const resigned = allLoads.filter((load) => RESIGNED_INVIGILATORS.includes(load.name));
  const max = Math.max(1, ...loads.map((load) => load.total));
  const average = loads.length ? loads.reduce((sum, load) => sum + load.recorded, 0) / loads.length : 0;
  const person = loads.find((load) => load.name === selected) ?? null;
  const summarySheet = book?.summary?.sheet ?? t("สรุป", "Summary");

  return (
    <PageContainer>
      <PageHeader
        icon={Users}
        title={t("ชั่วโมงคุมสอบ", "Invigilation hours")}
        description={t(
          "เรียงจากชั่วโมงน้อยไปมาก — คนบนสุดควรได้รับมอบหมายก่อนเพื่อให้ภาระเท่ากัน",
          "Sorted from fewest hours to most — assign the person at the top first to keep workloads even",
        )}
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
                <CardTitle>{t("ชั่วโมงสะสมรายบุคคล", "Hours per person")}</CardTitle>
                <CardDescription>
                  {t(`ตัวเลขหลัก = ชั่วโมงรวมในแท็บ “${summarySheet}” (ตรงกับชีต)`, `Main figure = total hours in the “${summarySheet}” tab (as in the sheet)`)} ·{" "}
                  <b className="text-brand-600">+</b> {t("= สอบที่จัดไว้แล้วแต่ยังไม่ถึงวัน", "= exams scheduled but not yet held")} ·{" "}
                  {t(
                    `เรียงจากภาระรวมน้อยไปมาก · เฉลี่ย ${average.toFixed(1)} ชม.`,
                    `Sorted by total workload, lowest first · average ${average.toFixed(1)} h`,
                  )}
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
                        "grid w-full cursor-pointer grid-cols-[88px_1fr_112px] items-center gap-3 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-neutral-50",
                        selected === load.name && "bg-brand-50",
                      )}
                    >
                      <span className="truncate font-medium text-neutral-800">
                        {load.name}
                        {B55.has(load.name) ? <span className="ml-1 text-[10px] text-brand-600">{t("ตึก 55", "Bldg 55")}</span> : null}
                      </span>
                      <span className="flex h-3 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
                        <span className="bg-brand-600" style={{ width: `${(load.recorded / max) * 100}%` }} />
                        <span className="bg-amber-400" style={{ width: `${(load.unrecorded / max) * 100}%` }} />
                        <span className="bg-brand-300" style={{ width: `${(load.planned / max) * 100}%` }} />
                      </span>
                      <span className="text-right tabular text-neutral-700">
                        <b className="font-semibold text-neutral-900">{load.recorded}</b>
                        {load.planned ? <span className="ml-1 text-[11px] text-brand-600">+{load.planned}</span> : null}
                        {load.unrecorded ? <span className="ml-1 text-[11px] text-amber-600">+{load.unrecorded}?</span> : null}
                        <span className="ml-1 text-[11px] text-muted-foreground">{t("ชม.", "h")}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {resigned.length ? (
                <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                  {t("ลาออกแล้ว (ไม่นับในการจัดงาน)", "Resigned (not assigned new work)")}:{" "}
                  {resigned.map((load) => `${load.name} ${formatHoursShort(load.recorded, locale)}`).join(" · ")}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>
                    {person
                      ? t(`งานที่จัดให้ ${person.name}`, `Assignments for ${person.name}`)
                      : t("เลือกชื่อเพื่อดูงานที่จัดไว้", "Select a name to see their assignments")}
                  </CardTitle>
                  <CardDescription>
                    {person
                      ? t(
                          `ในชีต ${person.recorded} ชม. · จัดไว้ล่วงหน้า ${person.planned} ชม.${person.unrecorded ? ` · สอบไปแล้วแต่ยังไม่ลงแท็บสรุป ${person.unrecorded} ชม.` : ""}`,
                          `In the sheet: ${person.recorded} h · scheduled ahead: ${person.planned} h${person.unrecorded ? ` · held but not yet in the summary tab: ${person.unrecorded} h` : ""}`,
                        )
                      : t("งานที่ยังไม่ได้นับในแท็บสรุป", "Work not yet counted in the summary tab")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {person ? (
                  person.pending.length + person.missing.length ? (
                    <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border text-[13px]">
                      {[...person.missing, ...person.pending].map((entry) => (
                        <li key={entry.id} className={cn("px-3 py-2", entry.date && entry.date < today && "text-neutral-400")}>
                          <p className="font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground tabular">
                            {entry.date ? mediumDay(entry.date, locale) : t("ยังไม่มีวัน", "No date yet")} · {timeSpan(entry.start, entry.end, locale)} ·{" "}
                            {entry.rooms.join(", ") || t("ยังไม่มีห้อง", "No room yet")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">{t("ไม่มีงานค้างนอกแท็บสรุป", "Nothing outstanding outside the summary tab")}</p>
                  )
                ) : null}
              </CardContent>
            </Card>

            {missing.length ? (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CircleAlert className="size-4 text-warning" aria-hidden /> {t("สอบไปแล้วแต่ยังไม่อยู่ในแท็บสรุป", "Held but missing from the summary tab")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        `มีในแท็บรายเดือนแต่ไม่มีคอลัมน์ในแท็บ “${summarySheet}” — ชั่วโมงนี้ยังไม่ถูกนับในชีต (แสดงเป็นสีเหลือง +?)`,
                        `In a monthly tab but with no column in the “${summarySheet}” tab — these hours are not yet counted in the sheet (shown in amber as +?)`,
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1.5 text-[13px] text-neutral-700">
                    {missing.map(({ entry, people }) => (
                      <li key={entry.id} className="flex gap-2">
                        <Badge tone="warning">{t("ตรวจ", "Check")}</Badge>
                        <span>
                          {entry.date ? mediumDay(entry.date, locale) : ""} {timeSpan(entry.start, entry.end, locale)} · {entry.title} — {people.join(", ")}{" "}
                          <span className="text-muted-foreground">({t(`${entry.sheet} แถว ${entry.row}`, `${entry.sheet}, row ${entry.row}`)})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {book.summary?.warnings.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CircleAlert className="size-4 text-warning" aria-hidden /> {t("จุดที่ควรแก้ในชีต", "Issues to fix in the sheet")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1.5 text-[13px] text-neutral-700">
                    {book.summary.warnings.map((warning) => (
                      <li key={warning.th} className="flex gap-2">
                        <Badge tone="warning">{t("ตรวจ", "Check")}</Badge>
                        <span>{t(warning)}</span>
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
