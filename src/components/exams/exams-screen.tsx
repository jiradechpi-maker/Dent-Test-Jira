"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, FileCheck2, MoveRight } from "lucide-react";
import { MY_YEAR } from "@/config/data-sources";
import { crossCheckYear, findExamClashes, findIncompleteExams, sortIssues, type IssueSeverity } from "@/lib/schedule/checks";
import { examSnapshot } from "@/lib/schedule/diff";
import { invigilatorLoads } from "@/lib/schedule/load";
import { YearBadge } from "@/components/courses/course-picker";
import { withSuggestions } from "@/lib/schedule/suggest";
import { mediumDay, shortDay, timeSpan } from "@/lib/schedule/format";
import type { ExamEntry } from "@/lib/schedule/invigilation";
import { displayYear, formatMonthYear, monthName } from "@/lib/i18n/dates";
import type { Locale } from "@/lib/i18n/locale";
import { todayInBangkok } from "@/lib/thai";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ChangesCard } from "@/components/schedule/changes-card";
import { IssueList } from "@/components/schedule/issue-list";
import { ClearUploadButton, RefreshButton, SourceSetupCard, SourceStatus } from "@/components/schedule/sync-status";
import { useChangeTracker, useScheduleBundle } from "@/components/schedule/use-schedule";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";

const UNDATED = "undated";

/** "2026-10" → "ตุลาคม 69" (like the sheet's own tab names) · "Oct 2026". */
function monthLabel(month: string, locale: Locale): string {
  if (locale === "en") return formatMonthYear(month, "en", "short");
  const [y, m] = month.split("-").map(Number);
  return `${monthName(m!, "th")} ${String(displayYear(y!, "th")).slice(-2)}`;
}

export function ExamsScreen() {
  const { query, teaching, invigilation, refresh, refreshing, upload, clearUpload, hasUpload, serviceAccountEmail } = useScheduleBundle();
  const t = useT();
  const [today] = useState(() => todayInBangkok());
  const book = invigilation?.ok ? invigilation.data : null;

  const snapshot = useMemo(
    () => (book && invigilation?.ok ? examSnapshot(book.entries, invigilation.source.fetchedAt) : null),
    [book, invigilation],
  );
  const tracker = useChangeTracker("invigilation", snapshot);

  const [severity, setSeverity] = useState<IssueSeverity | "all">("all");
  const issues = useMemo(() => {
    if (!book) return [];
    const all = [
      ...findExamClashes(book.entries.filter((entry) => !entry.date || entry.date >= today)),
      ...findIncompleteExams(book.entries, today),
      ...(teaching?.ok ? crossCheckYear(book, teaching.data, MY_YEAR).filter((issue) => !issue.date || issue.date >= today) : []),
    ];
    return withSuggestions(sortIssues(all), book.entries, invigilatorLoads(book, today));
  }, [book, teaching, today]);
  const shownIssues = severity === "all" ? issues : issues.filter((issue) => issue.severity === severity);

  const months = useMemo(() => book?.months.map((tab) => tab.month) ?? [], [book]);
  const defaultMonth = months.includes(today.slice(0, 7)) ? today.slice(0, 7) : (months.at(-1) ?? UNDATED);
  const [month, setMonth] = useState(defaultMonth);
  useEffect(() => setMonth(defaultMonth), [defaultMonth]);
  const [year, setYear] = useState<number | "all">("all");

  const rows = useMemo(() => {
    if (!book) return [];
    return book.entries
      .filter((entry) => (month === UNDATED ? !entry.date : entry.date?.startsWith(month)))
      .filter((entry) => year === "all" || entry.year === year);
  }, [book, month, year]);
  const undatedCount = book?.entries.filter((entry) => !entry.date).length ?? 0;
  const issueIds = useMemo(() => new Map(issues.flatMap((issue) => issue.examIds.map((id) => [id, issue.severity] as const))), [issues]);

  return (
    <PageContainer>
      <PageHeader
        icon={ClipboardList}
        title={t("ตารางสอบและกรรมการคุมสอบ", "Exams and invigilation")}
        description={t(
          "จาก “ตารางบันทึกเวลาคุมสอบ” บน Google Drive · ตรวจห้องชน กรรมการซ้อนเวลา และเทียบวันสอบกับตารางสอนให้อัตโนมัติ",
          "From the invigilation log (“ตารางบันทึกเวลาคุมสอบ”) on Google Drive · automatically checks for room clashes, double-booked invigilators and exam dates that disagree with the timetable",
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

      {query.isPending && !invigilation ? <Skeleton className="h-80 w-full" /> : null}
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
        <div className="flex flex-col gap-5">
          <ChangesCard changes={tracker.changes} since={tracker.since} onAcknowledge={tracker.acknowledge} />

          <Card>
            <CardHeader className="flex-col sm:flex-row">
              <div>
                <CardTitle>{t(`สิ่งที่ต้องตรวจ (${issues.length})`, `Items to review (${issues.length})`)}</CardTitle>
                <CardDescription>
                  {t(
                    `เฉพาะสอบที่ยังไม่ถึงวัน · เทียบวันสอบปี ${MY_YEAR} กับตารางสอน${teaching?.ok ? "" : " (ยังเปิดตารางสอนไม่ได้ — ข้ามการเทียบ)"}`,
                    `Upcoming exams only · Year ${MY_YEAR} exam dates compared with the timetable${teaching?.ok ? "" : " (timetable unavailable — comparison skipped)"}`,
                  )}
                </CardDescription>
              </div>
              <Segmented<IssueSeverity | "all">
                ariaLabel={t("ระดับ", "Severity")}
                value={severity}
                onChange={setSeverity}
                options={[
                  { value: "all", label: t("ทั้งหมด", "All") },
                  { value: "danger", label: `${t("ด่วน", "Urgent")} (${issues.filter((i) => i.severity === "danger").length})` },
                  { value: "warning", label: `${t("ตรวจ", "Review")} (${issues.filter((i) => i.severity === "warning").length})` },
                  { value: "info", label: t("แจ้งให้ทราบ", "Info") },
                ]}
              />
            </CardHeader>
            <CardContent>
              <IssueList
                issues={shownIssues}
                empty={t("ไม่พบห้องชน กรรมการซ้อนเวลา หรือวันสอบที่ไม่ตรงกัน", "No room clashes, double-booked invigilators or mismatched exam dates")}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-border px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="overflow-x-auto scrollbar-thin">
                <Segmented<string>
                  ariaLabel={t("เดือน", "Month")}
                  value={month}
                  onChange={setMonth}
                  options={[
                    ...months.map((value) => ({ value, label: monthLabel(value, t.locale) })),
                    ...(undatedCount ? [{ value: UNDATED, label: `${t("ยังไม่มีวัน", "No date yet")} (${undatedCount})` }] : []),
                  ]}
                />
              </div>
              <Segmented<string>
                ariaLabel={t("ชั้นปี", "Student year")}
                value={String(year)}
                onChange={(value) => setYear(value === "all" ? "all" : Number(value))}
                options={[
                  { value: "all", label: t("ทุกชั้นปี", "All years") },
                  ...[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: t(`ปี ${y}`, `Year ${y}`) })),
                ]}
              />
            </div>
            <ExamTable rows={rows} today={today} issueIds={issueIds} />
          </Card>
        </div>
      ) : null}
    </PageContainer>
  );
}

function ExamTable({ rows, today, issueIds }: { rows: ExamEntry[]; today: string; issueIds: Map<string, IssueSeverity> }) {
  const t = useT();
  const locale = t.locale;
  if (rows.length === 0) return <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">{t("ไม่มีรายการสอบ", "No exams")}</p>;
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[900px] text-left text-[13px]">
        <thead className="bg-neutral-50 text-xs text-neutral-500">
          <tr className="h-[var(--spacing-row)]">
            <th scope="col" className="px-3 font-medium">{t("วันที่", "Date")}</th>
            <th scope="col" className="px-3 font-medium">{t("เวลา", "Time")}</th>
            <th scope="col" className="px-3 font-medium">{t("รายวิชา", "Course")}</th>
            <th scope="col" className="px-3 font-medium">{t("ปี", "Year")}</th>
            <th scope="col" className="px-3 font-medium">{t("ห้องสอบ", "Exam room")}</th>
            <th scope="col" className="px-3 font-medium">{t("กรรมการคุมสอบ", "Invigilators")}</th>
            <th scope="col" className="px-3 font-medium">{t("ข้อสอบ", "Exam paper")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const past = entry.date !== null && entry.date < today;
            const flagged = issueIds.get(entry.id);
            return (
              <tr
                key={entry.id}
                className={cn(
                  "border-t border-border align-top hover:bg-row-hover",
                  past && "text-neutral-400",
                  entry.year === MY_YEAR && !past && "bg-brand-50/40",
                )}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {entry.date ? (
                    entry.date === today ? (
                      <b className="text-brand-700">{t("วันนี้", "Today")}</b>
                    ) : (
                      mediumDay(entry.date, locale)
                    )
                  ) : (
                    <Badge tone="warning">{t("ยังไม่มีวัน", "No date yet")}</Badge>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap tabular">{timeSpan(entry.start, entry.end, locale)}</td>
                <td className="px-3 py-2">
                  <span className={cn("font-medium", past ? "text-neutral-500" : "text-neutral-900")}>{entry.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    {entry.code ? <span className="font-mono">{entry.code}</span> : null}
                    {entry.remark ? (
                      <Badge tone="warning">
                        <MoveRight aria-hidden /> {entry.remark}
                      </Badge>
                    ) : null}
                    {flagged ? <Badge tone={flagged === "danger" ? "danger" : flagged === "warning" ? "warning" : "info"}>{t("ต้องตรวจ", "Needs review")}</Badge> : null}
                  </span>
                </td>
                <td className="px-3 py-2">{entry.year ? <YearBadge year={entry.year} /> : "—"}</td>
                <td className="px-3 py-2">{entry.rooms.length ? entry.rooms.join(" · ") : <span className="text-warning">{t("ยังไม่มีห้อง", "No room yet")}</span>}</td>
                <td className="px-3 py-2">
                  {entry.invigilators.length ? (
                    <span className="flex flex-wrap gap-1">
                      {entry.invigilators.map((name) => (
                        <Badge key={name}>{name}</Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="text-warning">{t("ยังไม่มีกรรมการ", "No invigilators yet")}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {entry.paperReceived ? (
                    <Badge tone="success">
                      <FileCheck2 aria-hidden /> {t("ได้รับแล้ว", "Received")}
                    </Badge>
                  ) : entry.submitBy ? (
                    <span className={cn(!past && entry.submitBy <= today ? "font-medium text-danger" : "text-muted-foreground")}>
                      {t("ส่งภายใน", "Due")} {shortDay(entry.submitBy, locale)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
