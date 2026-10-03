import type { Metadata } from "next";
import { Building2, Database, DoorOpen, Users } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BUILDINGS, DAY_COLORS, INVIGILATORS, ROOM_RULES, yearColor } from "@/config/master-data";
import { COURSES_DATA } from "@/data/course-catalog";

export const metadata: Metadata = { title: "ข้อมูลหลัก" };

export default function MasterDataPage() {
  const byYear = [1, 2, 3, 4, 5, 6].map((year) => ({ year, count: COURSES_DATA.filter((c) => c.year === year).length }));

  return (
    <PageContainer>
      <PageHeader
        icon={Database}
        title="ข้อมูลหลัก"
        description="ข้อมูลตั้งต้นของระบบ (อ่านอย่างเดียว) — แก้ไขได้เมื่อเชื่อมฐานข้อมูลใน Phase 1"
        className="mb-5"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-brand-600" aria-hidden /> บุคลากรคุมสอบ
              </CardTitle>
              <CardDescription>{INVIGILATORS.length} คน · ประจำตึก 55 ได้สิทธิ์ก่อนเมื่อสอบที่ตึก 55</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-1.5">
              {INVIGILATORS.map((person) => (
                <li key={person.nickname}>
                  <Badge tone={person.priority ? "brand" : "neutral"} className="h-6 px-2.5 text-xs">
                    {person.nickname}
                    {person.priority ? " · ตึก 55" : ""}
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
                <DoorOpen className="size-4 text-brand-600" aria-hidden /> กฎการจัดห้องสอบ
              </CardTitle>
              <CardDescription>ใช้โดยตัวจัดห้องสอบอัตโนมัติ (Phase 3)</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-[var(--radius-control)] border border-border scrollbar-thin">
              <table className="w-full min-w-[480px] text-left text-[13px]">
                <thead className="bg-neutral-50 text-xs text-neutral-500">
                  <tr className="h-[var(--spacing-row)]">
                    <th scope="col" className="px-3 font-medium">อาคาร</th>
                    <th scope="col" className="px-3 font-medium">ห้อง</th>
                    <th scope="col" className="px-3 text-right font-medium">กรรมการ</th>
                  </tr>
                </thead>
                <tbody>
                  {ROOM_RULES.map((rule) => (
                    <tr key={rule.id} className="h-[var(--spacing-row)] border-t border-border align-middle hover:bg-row-hover">
                      <td className="px-3 py-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-neutral-800">
                          <Building2 className="size-3.5 text-neutral-400" aria-hidden />
                          {BUILDINGS[rule.building].short}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{BUILDINGS[rule.building].years}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="text-neutral-800">{rule.rooms.join(" · ")}</span>
                        <span className="block text-[11px] text-muted-foreground">{rule.note}</span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium tabular">{rule.invigilators} คน</td>
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
              <CardTitle>รายวิชาในหลักสูตร</CardTitle>
              <CardDescription>ทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) · {COURSES_DATA.length} รายการ</CardDescription>
            </div>
            <Link href="/courses" className="text-xs font-medium text-brand-700 hover:underline">
              ดูรายวิชาทั้งหมด →
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
                <p className="text-[11px] opacity-80">ชั้นปี {year}</p>
                <p className="text-lg font-semibold tabular">{count}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>สีประจำวัน</CardTitle>
              <CardDescription>ใช้ในตารางสอบรายเดือน</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {DAY_COLORS.map((day) => (
              <span key={day.short} className="flex h-8 items-center rounded-[var(--radius-chip)] px-3 text-xs font-medium text-neutral-800" style={{ background: day.hex }}>
                {day.name}
              </span>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
