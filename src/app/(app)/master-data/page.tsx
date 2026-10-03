import type { Metadata } from "next";
import { Building2, Database, DoorOpen, Users } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BUILDINGS, DAY_COLORS, INVIGILATORS, ROOM_RULES, yearColor } from "@/config/master-data";
import { COURSES_DATA } from "@/data/course-catalog";
import { getNavItem } from "@/config/navigation";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("master-data").label) };
}

export default async function MasterDataPage() {
  const t = await getT();
  const byYear = [1, 2, 3, 4, 5, 6].map((year) => ({ year, count: COURSES_DATA.filter((c) => c.year === year).length }));

  return (
    <PageContainer>
      <PageHeader
        icon={Database}
        title={t("ข้อมูลหลัก", "Master data")}
        description={t(
          "ข้อมูลตั้งต้นของระบบ (อ่านอย่างเดียว) — แก้ไขได้เมื่อเชื่อมฐานข้อมูลใน Phase 1",
          "Reference data for the system (read-only) — becomes editable once the database is connected in Phase 1",
        )}
        className="mb-5"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-brand-600" aria-hidden /> {t("บุคลากรคุมสอบ", "Invigilators")}
              </CardTitle>
              <CardDescription>
                {t(
                  `${INVIGILATORS.length} คน · ประจำตึก 55 ได้สิทธิ์ก่อนเมื่อสอบที่ตึก 55`,
                  `${INVIGILATORS.length} people · Building 55 staff have priority for exams held in Building 55`,
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-1.5">
              {INVIGILATORS.map((person) => (
                <li key={person.nickname}>
                  <Badge tone={person.priority ? "brand" : "neutral"} className="h-6 px-2.5 text-xs">
                    {person.nickname}
                    {person.priority ? ` · ${t(BUILDINGS.B55.short)}` : ""}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="size-4 text-brand-600" aria-hidden /> {t("กฎการจัดห้องสอบ", "Exam room rules")}
              </CardTitle>
              <CardDescription>{t("ใช้โดยตัวจัดห้องสอบอัตโนมัติ (Phase 3)", "Used by the automatic exam room planner (Phase 3)")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-[var(--radius-control)] border border-border scrollbar-thin">
              <table className="w-full min-w-[480px] text-left text-[13px]">
                <thead className="bg-neutral-50 text-xs text-neutral-500">
                  <tr className="h-[var(--spacing-row)]">
                    <th scope="col" className="px-3 font-medium">
                      {t("อาคาร", "Building")}
                    </th>
                    <th scope="col" className="px-3 font-medium">
                      {t("ห้อง", "Rooms")}
                    </th>
                    <th scope="col" className="px-3 text-right font-medium">
                      {t("กรรมการ", "Invigilators")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROOM_RULES.map((rule) => (
                    <tr key={rule.id} className="h-[var(--spacing-row)] border-t border-border align-middle hover:bg-row-hover">
                      <td className="px-3 py-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-neutral-800">
                          <Building2 className="size-3.5 text-neutral-400" aria-hidden />
                          {t(BUILDINGS[rule.building].short)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{t(BUILDINGS[rule.building].years)}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="text-neutral-800">{rule.rooms.join(" · ")}</span>
                        <span className="block text-[11px] text-muted-foreground">{t(rule.note)}</span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium tabular">{t(`${rule.invigilators} คน`, String(rule.invigilators))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t(getNavItem("courses").label)}</CardTitle>
              <CardDescription>
                {t(
                  `ทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) · ${COURSES_DATA.length} รายการ`,
                  `Doctor of Dental Surgery (International Program) · ${COURSES_DATA.length} courses`,
                )}
              </CardDescription>
            </div>
            <Link href="/courses" className="text-xs font-medium text-brand-700 hover:underline">
              {t("ดูรายวิชาทั้งหมด →", "View all courses →")}
            </Link>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {byYear.map(({ year, count }) => (
              <Link
                key={year}
                href="/courses"
                className="rounded-[var(--radius-control)] px-3 py-2 text-center transition-[filter] hover:brightness-95"
                style={{ background: yearColor(year)?.bg, color: yearColor(year)?.fg }}
              >
                <p className="text-[11px] opacity-80">{t(`ชั้นปี ${year}`, `Year ${year}`)}</p>
                <p className="text-lg font-semibold tabular">{count}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("สีประจำวัน", "Weekday colours")}</CardTitle>
              <CardDescription>{t("ใช้ในตารางสอบรายเดือน", "Used in the monthly exam timetable")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {DAY_COLORS.map((day) => (
              <span key={day.hex} className="flex h-8 items-center rounded-[var(--radius-chip)] px-3 text-xs font-medium text-neutral-800" style={{ background: day.hex }}>
                {t(day.name)}
              </span>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
