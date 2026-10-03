"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck } from "lucide-react";
import { MY_YEAR } from "@/config/data-sources";
import { getNavItem } from "@/config/navigation";
import { crossCheckYear, sortIssues } from "@/lib/schedule/checks";
import { teachingSnapshot } from "@/lib/schedule/diff";
import { todayInBangkok } from "@/lib/thai";
import { useT } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangesCard } from "./changes-card";
import { IssueList } from "./issue-list";
import { ClearUploadButton, RefreshButton, SourceSetupCard, SourceStatus } from "./sync-status";
import { TeachingView } from "./teaching-view";
import { useChangeTracker, useScheduleBundle } from "./use-schedule";

export function ScheduleScreen() {
  const t = useT();
  const { query, teaching, invigilation, refresh, refreshing, upload, clearUpload, hasUpload, serviceAccountEmail } = useScheduleBundle();
  const [today] = useState(() => todayInBangkok());

  const schedule = teaching?.ok ? teaching.data : null;
  const snapshot = useMemo(
    () => (schedule && teaching?.ok ? teachingSnapshot(schedule.sessions, teaching.source.fetchedAt) : null),
    [schedule, teaching],
  );
  const tracker = useChangeTracker(`teaching-y${MY_YEAR}`, snapshot);

  const issues = useMemo(() => {
    if (!schedule || !invigilation?.ok) return [];
    return sortIssues(crossCheckYear(invigilation.data, schedule, MY_YEAR)).filter(
      (issue) => issue.severity !== "info" && (issue.date === null || issue.date >= today),
    );
  }, [schedule, invigilation, today]);

  return (
    <PageContainer>
      <PageHeader
        icon={CalendarDays}
        title={t(`ตารางสอนชั้นปี ${MY_YEAR}`, `Year ${MY_YEAR} timetable`)}
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {schedule?.title ?? t("ดึงจาก Google Drive", "From Google Drive")}
            <Badge tone="neutral" className="h-5">
              <ShieldCheck aria-hidden /> {t("อ่านอย่างเดียว · แก้ไขในไฟล์ต้นฉบับ", "Read-only · edit in the source file")}
            </Badge>
          </span>
        }
        actions={<RefreshButton onRefresh={refresh} refreshing={refreshing} />}
        className="mb-3"
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SourceStatus result={teaching} />
        {hasUpload.teaching && teaching?.ok && teaching.source.mode === "upload" ? <ClearUploadButton onClear={() => clearUpload("teaching")} /> : null}
      </div>

      {query.isPending && !teaching ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : null}
      {query.isError && !teaching ? (
        <p className="text-[13px] text-danger">
          {t("โหลดข้อมูลไม่สำเร็จ — กด “ซิงก์เดี๋ยวนี้” เพื่อลองใหม่", "Could not load the data — click “Sync now” to try again")}
        </p>
      ) : null}

      {teaching && !teaching.ok ? (
        <SourceSetupCard
          sourceKey="teaching"
          label={teaching.label}
          url={teaching.url}
          error={teaching.error}
          serviceAccountEmail={serviceAccountEmail}
          onUpload={upload}
        />
      ) : null}

      {schedule ? (
        <div className="flex flex-col gap-5">
          <ChangesCard changes={tracker.changes} since={tracker.since} onAcknowledge={tracker.acknowledge} />

          {issues.length > 0 ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>
                    {t(`วันสอบปี ${MY_YEAR} ที่ยังไม่ตรงกับตารางคุมสอบ`, `Year ${MY_YEAR} exam dates that do not match the invigilation log`)}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "เทียบกับ “ตารางบันทึกเวลาคุมสอบ” อัตโนมัติ — แจ้งเจ้าหน้าที่ผู้ดูแลตารางคุมสอบให้แก้ตาม",
                      "Checked automatically against the invigilation log (“ตารางบันทึกเวลาคุมสอบ”) — ask the staff member who maintains it to update it",
                    )}
                  </CardDescription>
                </div>
                <Link href="/exams" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  {t(getNavItem("exams").label)} <ArrowRight aria-hidden />
                </Link>
              </CardHeader>
              <CardContent>
                <IssueList issues={issues} />
              </CardContent>
            </Card>
          ) : null}

          <TeachingView schedule={schedule} today={today} />
        </div>
      ) : null}
    </PageContainer>
  );
}
