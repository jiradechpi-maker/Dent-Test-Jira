"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { YEAR_COLORS, yearColor } from "@/config/master-data";
import {
  CATEGORY_LABEL,
  SEMESTER_TABS,
  coursesFor,
  searchCourses,
  type CatalogSemester,
  type CourseCatalogItem,
} from "@/data/course-catalog";
import { cn } from "@/lib/utils";

/** Six cohort chips in their sheet colours. */
export function YearTabs({ value, onChange, counts }: { value: number; onChange: (year: number) => void; counts?: Record<number, number> }) {
  return (
    <div role="radiogroup" aria-label="ชั้นปี" className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {YEAR_COLORS.map((color) => {
        const selected = color.year === value;
        return (
          <button
            key={color.year}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(color.year)}
            className={cn(
              "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-control)] border text-[13px] font-medium transition-[box-shadow,background-color] outline-none focus-visible:shadow-[var(--shadow-focus)]",
              selected ? "border-transparent text-white shadow-[var(--shadow-sm)]" : "border-border bg-card hover:brightness-[0.98]",
            )}
            style={selected ? { background: color.solid } : { color: color.fg, background: color.bg }}
          >
            ปี {color.year}
            {counts ? <span className={cn("text-[11px] tabular", selected ? "text-white/75" : "opacity-60")}>{counts[color.year] ?? 0}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function YearBadge({ year, className }: { year: number | null | undefined; className?: string }) {
  const color = yearColor(year);
  if (!color) return null;
  return (
    <span
      className={cn("inline-flex h-5 shrink-0 items-center rounded-[var(--radius-chip)] px-1.5 text-[11px] font-medium whitespace-nowrap", className)}
      style={{ background: color.bg, color: color.fg }}
    >
      ปี {color.year}
    </span>
  );
}

function CourseRow({ course, selected, showYear, onPick }: { course: CourseCatalogItem; selected: boolean; showYear: boolean; onPick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-pressed={selected}
        className={cn(
          "grid w-full cursor-pointer grid-cols-[76px_1fr_auto] items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-neutral-50",
          selected && "bg-brand-50 hover:bg-brand-50",
        )}
      >
        <span className="font-[family-name:var(--font-mono)] text-[11px] text-muted-foreground tabular">{course.code}</span>
        <span className={cn("min-w-0 truncate", selected ? "font-medium text-brand-900" : "text-neutral-800")} title={course.name}>
          {course.name}
        </span>
        <span className="flex items-center gap-1.5">
          {showYear ? <YearBadge year={course.year} /> : null}
          {course.category && course.category !== "core" ? (
            <span className="text-[10px] text-muted-foreground">{CATEGORY_LABEL[course.category]}</span>
          ) : null}
          {selected ? <Check className="size-3.5 text-brand-600" aria-hidden /> : null}
        </span>
      </button>
    </li>
  );
}

/**
 * Year → semester → course, so only one cohort's handful of courses is on screen at a time.
 * Typing in the search box looks across every year instead.
 */
export function CoursePicker({
  year,
  onYearChange,
  semester,
  onSemesterChange,
  selectedName,
  onPick,
}: {
  year: number;
  onYearChange: (year: number) => void;
  semester: CatalogSemester;
  onSemesterChange: (semester: CatalogSemester) => void;
  selectedName: string;
  onPick: (course: CourseCatalogItem) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCourses(query), [query]);
  const yearCourses = useMemo(() => coursesFor(year), [year]);
  const tabs = SEMESTER_TABS.filter((tab) => yearCourses.some((c) => c.semester === tab.value));
  const activeSemester = tabs.some((tab) => tab.value === semester) ? semester : (tabs[0]?.value ?? "1");
  const list = query.trim() ? results : yearCourses.filter((c) => c.semester === activeSemester);
  const selectedKey = selectedName.trim().toLowerCase();
  const color = yearColor(year);

  return (
    <div className="flex flex-col gap-2">
      <YearTabs value={year} onChange={onYearChange} />

      <div className="flex flex-wrap items-center gap-2">
        {!query.trim() ? (
          <div role="radiogroup" aria-label="ภาคเรียน" className="inline-flex rounded-[var(--radius-control)] bg-neutral-100 p-0.5">
            {tabs.map((tab) => {
              const selected = tab.value === activeSemester;
              const count = yearCourses.filter((c) => c.semester === tab.value).length;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSemesterChange(tab.value)}
                  className={cn(
                    "h-7 cursor-pointer rounded-[6px] px-3 text-xs font-medium whitespace-nowrap transition-colors",
                    selected ? "bg-card text-neutral-900 shadow-[var(--shadow-sm)]" : "text-neutral-500 hover:text-neutral-800",
                  )}
                >
                  {tab.short} <span className="text-[11px] text-muted-foreground tabular">{count}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        <label className="relative ml-auto min-w-[180px] flex-1 sm:max-w-[260px]">
          <span className="sr-only">ค้นหารายวิชา</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ/รหัสวิชา ทุกชั้นปี"
            className="h-8 w-full rounded-[var(--radius-control)] border border-border bg-card pr-7 pl-8 text-xs outline-none placeholder:text-neutral-400 focus-visible:border-brand-400 focus-visible:shadow-[var(--shadow-focus)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="ล้างคำค้น"
              className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 hover:text-neutral-700"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-control)] border border-border"
        style={!query.trim() && color ? { borderLeft: `3px solid ${color.solid}` } : undefined}
      >
        {list.length ? (
          <ul className="max-h-64 divide-y divide-border overflow-y-auto scrollbar-thin">
            {list.map((course) => (
              <CourseRow
                key={`${course.code}-${course.name}`}
                course={course}
                showYear={Boolean(query.trim())}
                selected={course.name.toLowerCase() === selectedKey}
                onPick={() => {
                  onPick(course);
                  setQuery("");
                }}
              />
            ))}
          </ul>
        ) : (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">ไม่พบรายวิชา — พิมพ์ชื่อวิชาเองในช่องด้านล่างได้</p>
        )}
      </div>
    </div>
  );
}
