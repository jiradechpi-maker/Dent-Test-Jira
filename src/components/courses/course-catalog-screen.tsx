"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Copy, Search, X } from "lucide-react";
import { toast } from "sonner";
import { DAY_COLORS, YEAR_COLORS, yearColor } from "@/config/master-data";
import { CATALOG_YEARS, CATEGORY_LABEL, SEMESTER_TABS, coursesFor, searchCourses, type CourseCatalogItem } from "@/data/course-catalog";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { YearBadge, YearTabs } from "./course-picker";

const STORAGE_KEY = "dentops.courses.year";

function readYear(): number {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    return CATALOG_YEARS.includes(stored as (typeof CATALOG_YEARS)[number]) ? stored : 4;
  } catch {
    return 4;
  }
}

async function copyCode(course: CourseCatalogItem) {
  try {
    await navigator.clipboard.writeText(`${course.code} ${course.name}`);
    toast.success("คัดลอกแล้ว", { description: `${course.code} ${course.name}` });
  } catch {
    toast.error("คัดลอกไม่ได้ในเบราว์เซอร์นี้");
  }
}

function CourseItem({ course, showYear }: { course: CourseCatalogItem; showYear?: boolean }) {
  return (
    <li className="group flex items-start gap-2.5 px-3 py-2">
      <button
        type="button"
        onClick={() => void copyCode(course)}
        title="คัดลอกรหัสและชื่อวิชา"
        className="mt-px flex shrink-0 cursor-pointer items-center gap-1 rounded px-1 font-[family-name:var(--font-mono)] text-[11px] text-neutral-500 tabular hover:bg-brand-50 hover:text-brand-700"
      >
        {course.code}
        <Copy className="size-3 opacity-0 group-hover:opacity-60" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug font-medium text-neutral-800">{course.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          {showYear ? <YearBadge year={course.year} /> : null}
          <span className="tabular">{course.credit}</span>
          {course.category && course.category !== "core" ? <span>{CATEGORY_LABEL[course.category]}</span> : null}
          {course.instructor && course.instructor !== "คณะทันตแพทยศาสตร์" && course.instructor !== "GE" ? <span>{course.instructor}</span> : null}
        </p>
      </div>
    </li>
  );
}

export function CourseCatalogScreen() {
  const [year, setYearState] = useState(4);
  useEffect(() => setYearState(readYear()), []);
  const [query, setQuery] = useState("");
  const setYear = (next: number) => {
    setYearState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // not remembered — fine
    }
  };
  const counts = useMemo(() => Object.fromEntries(CATALOG_YEARS.map((y) => [y, coursesFor(y).length])), []);
  const results = useMemo(() => searchCourses(query), [query]);
  const color = yearColor(year)!;
  const groups = SEMESTER_TABS.map((tab) => ({ ...tab, courses: coursesFor(year, tab.value) })).filter((group) => group.courses.length);

  return (
    <PageContainer>
      <PageHeader
        icon={BookOpen}
        title="รายวิชาในหลักสูตร"
        description="ทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) — เลือกชั้นปี แล้วดูวิชาแยกตามภาคเรียน · คลิกรหัสวิชาเพื่อคัดลอก"
        className="mb-4"
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <YearTabs value={year} onChange={setYear} counts={counts} />
        </div>
        <label className="relative lg:w-72">
          <span className="sr-only">ค้นหารายวิชา</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อหรือรหัสวิชา (ทุกชั้นปี)"
            className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-card pr-8 pl-9 text-sm outline-none placeholder:text-neutral-400 focus-visible:border-brand-400 focus-visible:shadow-[var(--shadow-focus)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="ล้างคำค้น"
              className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center text-neutral-400 hover:text-neutral-700"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>
      </div>

      {query.trim() ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>ผลการค้นหา “{query.trim()}”</CardTitle>
              <CardDescription>{results.length} รายวิชา จากทุกชั้นปี</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {results.length ? (
              <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border">
                {results.map((course) => (
                  <CourseItem key={`${course.code}-${course.name}`} course={course} showYear />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">ไม่พบรายวิชา</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid gap-4", groups.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
          {groups.map((group) => (
            <Card key={group.value} className="overflow-hidden">
              <div className="h-1" style={{ background: color.solid }} aria-hidden />
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <YearBadge year={year} /> {group.label}
                  </CardTitle>
                  <CardDescription>{group.courses.length} รายวิชา</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="-mx-3 divide-y divide-border">
                  {group.courses.map((course) => (
                    <CourseItem key={`${course.code}-${course.name}`} course={course} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>สีประจำชั้นปี</CardTitle>
              <CardDescription>ใช้ในตารางคุมสอบและตารางสอน · สีคณะ #4F0080</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {YEAR_COLORS.map((c) => (
              <div key={c.year} className="flex items-center gap-2 rounded-[var(--radius-control)] px-2.5 py-2" style={{ background: c.bg, color: c.fg }}>
                <span className="size-3 shrink-0 rounded-full" style={{ background: c.solid }} aria-hidden />
                <span className="text-xs">
                  <b className="font-semibold">ปี {c.year}</b> · {c.label}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>สีประจำวัน</CardTitle>
              <CardDescription>ใช้ในตารางสอบ / ตารางสอนรายเดือน</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[...DAY_COLORS.slice(1), DAY_COLORS[0]!].map((day) => (
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
