"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CalendarPlus,
  Copy,
  FileDown,
  FileText,
  FileType2,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { COURSES_DATA, findCourseByName, type CatalogSemester, type CourseCatalogItem } from "@/data/course-catalog";
import { CoursePicker } from "@/components/courses/course-picker";
import { DocumentApiError, requestInvitation, saveBlob } from "@/lib/invitation/client";
import {
  VENUE_PRESETS,
  clearDraft,
  defaultInvitation,
  emptyScheduleItem,
  keepCoordinator,
  loadDraft,
  newRowId,
  saveDraft,
} from "@/lib/invitation/defaults";
import { COORDINATOR_TITLES, invitationSchema, type DocumentFormat, type InvitationInput } from "@/lib/invitation/schema";
import {
  buildInvitationTemplateData,
  examTotals,
  invitationFileName,
  invitationProtectedWords,
  sessionExamPoints,
  totalScheduleHours,
} from "@/lib/invitation/template-data";
import { useHealth } from "@/components/system/service-status";
import { LetterPreview, LetterPrintRoot, letterPageCount, useAttachmentLayout } from "./letter/letter-document";
import {
  formatFullThaiDate,
  formatHours,
  formatLetterDate,
  formatScheduleDay,
  hoursBetween,
  parseIsoDate,
  THAI_MONTHS,
  toBuddhistYear,
  toThaiDigits,
} from "@/lib/thai";
import { cn } from "@/lib/utils";

const PdfViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-[1/1.414] w-full" />,
});

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; blob: Blob; key: string; fileName: string }
  | { status: "error"; message: string };

const LECTURER_SUGGESTIONS = Array.from(new Set(COURSES_DATA.flatMap((c) => c.specialLecturers ?? []))).sort((a, b) =>
  a.localeCompare(b),
);

const PREVIEW_DEBOUNCE_MS = 1200;

function firstError(errors: FieldErrors<InvitationInput>): string | null {
  const walk = (node: unknown): string | null => {
    if (!node || typeof node !== "object") return null;
    const record = node as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) return record.message;
    for (const value of Object.values(record)) {
      if (value && typeof value === "object" && value !== record.ref) {
        const found = walk(value);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(errors);
}

export function InvitationBuilder() {
  const form = useForm<InvitationInput>({
    resolver: zodResolver(invitationSchema),
    defaultValues: defaultInvitation(),
    mode: "onTouched",
  });
  const { register, control, handleSubmit, reset, setValue, getValues, formState } = form;
  const { errors } = formState;
  const schedule = useFieldArray({ control, name: "schedule", keyName: "_key" });

  const [hydrated, setHydrated] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [busy, setBusy] = useState<DocumentFormat | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A PDF server (Gotenberg) is optional. Without one, preview, print and PDF all happen in the browser.
  const health = useHealth();
  const pdfMode: "server" | "browser" = health.data?.services.pdf.healthy ? "server" : "browser";

  // Restore the saved draft after mount (localStorage is client-only).
  useEffect(() => {
    const draft = loadDraft();
    if (draft) reset(draft);
    setHydrated(true);
  }, [reset]);

  const values = useWatch({ control }) as InvitationInput;
  const valuesKey = useMemo(() => JSON.stringify(values), [values]);
  const validation = useMemo(() => invitationSchema.safeParse(values), [values]);

  // Autosave the draft.
  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => saveDraft(getValues()), 400);
    return () => window.clearTimeout(id);
  }, [hydrated, valuesKey, getValues]);

  const runPreview = useCallback(async (data: InvitationInput, key: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPreview({ status: "loading" });
    try {
      const { blob, fileName } = await requestInvitation(data, "pdf", controller.signal);
      if (controller.signal.aborted) return;
      setPreview({ status: "ready", blob, key, fileName });
    } catch (error) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
      setPreview({ status: "error", message: error instanceof Error ? error.message : "สร้างพรีวิวไม่สำเร็จ" });
    }
  }, []);

  // Auto-refresh the PDF preview shortly after the user stops typing (only when the form is valid).
  useEffect(() => {
    if (!hydrated || !validation.success || pdfMode !== "server") return;
    if (preview.status === "ready" && preview.key === valuesKey) return;
    const data = validation.data;
    const id = window.setTimeout(() => void runPreview(data, valuesKey), PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preview is read only to skip duplicate work
  }, [hydrated, valuesKey, validation, runPreview, pdfMode]);

  // In-browser letter (same layout as the .docx): preview, printing and PDF without a server.
  const letterData = useMemo(() => (validation.success ? buildInvitationTemplateData(validation.data) : null), [validation]);
  const letterWords = useMemo(() => (validation.success ? invitationProtectedWords(validation.data) : []), [validation]);
  const { layout: letterLayout, measurer } = useAttachmentLayout(letterData, letterWords);

  useEffect(() => () => abortRef.current?.abort(), []);

  const download = (format: DocumentFormat) =>
    handleSubmit(
      async (data) => {
        const key = JSON.stringify(data);
        if (format === "pdf" && pdfMode === "browser") {
          setBusy("pdf");
          try {
            const { exportLetterPdf } = await import("./letter/export-pdf");
            await exportLetterPdf(invitationFileName(data, "pdf"), `หนังสือเชิญอาจารย์พิเศษ ${data.courseName}`);
            toast.success("ดาวน์โหลด PDF แล้ว", { description: invitationFileName(data, "pdf") });
          } catch {
            toast.info("สร้างไฟล์ PDF ในเบราว์เซอร์ไม่สำเร็จ — เปิดหน้าพิมพ์แทน เลือกปลายทาง “บันทึกเป็น PDF”");
            window.print();
          } finally {
            setBusy(null);
          }
          return;
        }
        if (format === "pdf" && preview.status === "ready" && preview.key === key) {
          saveBlob(preview.blob, preview.fileName);
          toast.success("ดาวน์โหลด PDF แล้ว");
          return;
        }
        setBusy(format);
        try {
          const { blob, fileName } = await requestInvitation(data, format);
          saveBlob(blob, fileName);
          toast.success(format === "docx" ? "ดาวน์โหลดไฟล์ Word แล้ว" : "ดาวน์โหลด PDF แล้ว", { description: fileName });
        } catch (error) {
          const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
          const details = error instanceof DocumentApiError ? error.details.slice(0, 3).join(" · ") : undefined;
          toast.error(message, { description: details, action: { label: "ลองใหม่", onClick: () => void download(format)() } });
        } finally {
          setBusy(null);
        }
      },
      (formErrors) => {
        toast.error("กรอกข้อมูลยังไม่ครบ", { description: firstError(formErrors) ?? undefined });
      },
    );

  const printLetter = () =>
    void handleSubmit(
      () => window.setTimeout(() => window.print(), 50),
      (formErrors) => toast.error("กรอกข้อมูลยังไม่ครบ", { description: firstError(formErrors) ?? undefined }),
    )();

  const refreshPreview = () => {
    void handleSubmit(
      (data) => runPreview(data, JSON.stringify(data)),
      (formErrors) => toast.error("กรอกข้อมูลยังไม่ครบ", { description: firstError(formErrors) ?? undefined }),
    )();
  };

  const startNewLetter = () => {
    const next = keepCoordinator(getValues(), defaultInvitation());
    clearDraft();
    reset(next);
    abortRef.current?.abort();
    setPreview({ status: "idle" });
    setPageCount(null);
    toast("เริ่มหนังสือฉบับใหม่ (จำข้อมูลผู้ประสานงานไว้ให้)");
  };

  const onCourseChange = (name: string) => {
    const course = findCourseByName(name);
    if (!course) return;
    setValue("studentYear", course.year, { shouldDirty: true });
    if (course.semester !== "year") setValue("semester", course.semester, { shouldDirty: true });
    toast.info(`เติมชั้นปีที่ ${course.year}${course.semester !== "year" ? ` ภาคเรียนที่ ${course.semester}` : ""} ให้อัตโนมัติ`);
  };

  const [pickerSemester, setPickerSemester] = useState<CatalogSemester | null>(null);
  const formSemester = values.semester === "1" || values.semester === "2" ? values.semester : "1";
  const activePickerSemester = pickerSemester ?? formSemester;

  const pickCourse = (course: CourseCatalogItem) => {
    setValue("courseName", course.name, { shouldValidate: true, shouldDirty: true });
    setValue("studentYear", course.year, { shouldDirty: true });
    if (course.semester !== "year") setValue("semester", course.semester, { shouldDirty: true });
    setPickerSemester(course.semester);
  };

  const recomputeHours = (index: number) => {
    const row = getValues(`schedule.${index}`);
    const hours = hoursBetween(row.startTime, row.endTime);
    if (hours > 0) setValue(`schedule.${index}.hours`, hours, { shouldValidate: true, shouldDirty: true });
  };

  const th = values.thaiDigits !== false;
  const validRows = (values.schedule ?? []).filter((s) => Number.isFinite(s?.hours));
  const totalHours = totalScheduleHours(validRows);
  const pointsPerHour = Number.isFinite(values.pointsPerHour) ? values.pointsPerHour : 0;
  const exam = examTotals(validRows, pointsPerHour);
  const issue = parseIsoDate(values.issueDate ?? "");
  const issueDateText = issue ? formatLetterDate(values.issueDate, { includeDay: values.includeIssueDay, thaiDigits: th }) : "—";
  const daysInIssueMonth = issue ? new Date(Date.UTC(issue.year, issue.month, 0)).getUTCDate() : 31;
  const setIssueDate = (parts: { year?: number; month?: number; day?: number }) => {
    const current = issue ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: 1 };
    const year = parts.year ?? current.year;
    const month = parts.month ?? current.month;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const day = Math.min(Math.max(1, parts.day ?? current.day), lastDay);
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setValue("issueDate", iso, { shouldValidate: true, shouldDirty: true });
  };

  const previewStale = preview.status === "ready" && preview.key !== valuesKey;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void download("docx")();
        }}
        className="flex min-w-0 flex-col gap-4"
        aria-label="แบบฟอร์มหนังสือเชิญอาจารย์พิเศษ"
      >
        {/* 1. Letter */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>1 · ข้อมูลหนังสือ</CardTitle>
              <CardDescription>เลขที่และวันที่ของหนังสือ — ถ้ายังไม่ได้เลข ให้เว้นว่างไว้กรอกด้วยมือ</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="เลขที่หนังสือ"
              htmlFor="letterNo"
              error={errors.letterNo?.message}
              hint={`พิมพ์เป็น: ที่ อว ${th ? "๗๐๓๓" : "7033"} / ${values.letterNo ? (th ? toThaiDigits(values.letterNo) : values.letterNo) : "……"}`}
            >
              <Input id="letterNo" inputMode="numeric" placeholder="เว้นว่างได้ เช่น 311" aria-invalid={!!errors.letterNo} {...register("letterNo")} />
            </Field>
            <Field label="ลงวันที่ (เดือน / ปี พ.ศ.)" htmlFor="issueMonth" required error={errors.issueDate?.message} hint={`พิมพ์เป็น: ${issueDateText}`}>
              <div className="grid grid-cols-[1fr_96px] gap-2">
                <NativeSelect id="issueMonth" value={issue?.month ?? ""} onChange={(e) => setIssueDate({ month: Number(e.target.value) })} aria-label="เดือน">
                  {THAI_MONTHS.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
                <Input
                  type="number"
                  inputMode="numeric"
                  aria-label="ปี พ.ศ."
                  min={2560}
                  max={2700}
                  value={issue ? toBuddhistYear(issue.year) : ""}
                  onChange={(e) => {
                    const be = Number(e.target.value);
                    if (be >= 2400 && be <= 2800) setIssueDate({ year: be - 543 });
                  }}
                />
              </div>
            </Field>
            <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-border px-3 py-2 sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 cursor-pointer accent-[var(--color-brand-600)]"
                  checked={!values.includeIssueDay}
                  onChange={(e) => setValue("includeIssueDay", !e.target.checked, { shouldDirty: true })}
                />
                <span>
                  <span className="font-medium text-neutral-800">เว้นว่างวันที่ไว้ให้สารบรรณเขียนด้วยปากกา</span>
                  <span className="block text-[11px] text-muted-foreground">
                    หนังสือจะพิมพ์แค่เดือนและปี โดยเว้นที่ว่างด้านหน้าชื่อเดือนไว้เขียนเลขวันที่หลังเสนอเซ็น
                  </span>
                </span>
              </label>
              {values.includeIssueDay ? (
                <div className="flex items-center gap-2 pl-6">
                  <Label htmlFor="issueDay" className="text-[13px]">
                    ระบุวันที่
                  </Label>
                  <Input
                    id="issueDay"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={daysInIssueMonth}
                    className="w-20"
                    value={issue?.day ?? ""}
                    onChange={(e) => {
                      const day = Number(e.target.value);
                      if (day >= 1) setIssueDate({ day });
                    }}
                  />
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border px-3 py-2">
              <div>
                <Label htmlFor="thaiDigits">ใช้เลขไทย (๐-๙)</Label>
                <p className="text-[11px] text-muted-foreground">วันที่ เวลา เบอร์โทร ชั่วโมง</p>
              </div>
              <Controller
                control={control}
                name="thaiDigits"
                render={({ field }) => <Switch id="thaiDigits" checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Lecturer & course */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>2 · อาจารย์พิเศษและรายวิชา</CardTitle>
              <CardDescription>เลือกชั้นปีก่อน แล้วระบบแสดงเฉพาะวิชาของชั้นปีและภาคเรียนนั้น</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-6">
            <Field
              label="ชื่ออาจารย์พิเศษ (พร้อมคำนำหน้า/ตำแหน่ง)"
              htmlFor="lecturerName"
              required
              error={errors.lecturerName?.message}
              className="sm:col-span-6"
            >
              <Input
                id="lecturerName"
                list="lecturer-suggestions"
                placeholder="เช่น ผู้ช่วยศาสตราจารย์ ดร.ทันตแพทย์อริยะ จันทรมณี"
                aria-invalid={!!errors.lecturerName}
                {...register("lecturerName")}
              />
              <datalist id="lecturer-suggestions">
                {LECTURER_SUGGESTIONS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <div className="flex flex-col gap-1.5 sm:col-span-6">
              <Label>เลือกชั้นปี → ภาคเรียน → รายวิชา</Label>
              <CoursePicker
                year={Number.isFinite(values.studentYear) ? values.studentYear : 1}
                onYearChange={(year) => {
                  setValue("studentYear", year, { shouldDirty: true });
                  setPickerSemester(null);
                }}
                semester={activePickerSemester}
                onSemesterChange={(semester) => {
                  setPickerSemester(semester);
                  if (semester !== "year") setValue("semester", semester, { shouldDirty: true });
                }}
                selectedName={values.courseName ?? ""}
                onPick={pickCourse}
              />
            </div>
            <Field
              label="ชื่อรายวิชา (ภาษาอังกฤษ)"
              htmlFor="courseName"
              required
              error={errors.courseName?.message}
              hint="เติมให้เมื่อเลือกจากรายการ — วิชาที่ไม่มีในรายการพิมพ์เองได้"
              className="sm:col-span-6"
            >
              <Input
                id="courseName"
                placeholder="เช่น Fixed Prosthodontics"
                aria-invalid={!!errors.courseName}
                {...register("courseName", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => onCourseChange(e.target.value) })}
              />
            </Field>
            <Field label="ภาคการศึกษา" htmlFor="semester" required className="sm:col-span-3">
              <NativeSelect id="semester" {...register("semester")}>
                <option value="1">ภาคการศึกษาที่ 1</option>
                <option value="2">ภาคการศึกษาที่ 2</option>
                <option value="3">ภาคการศึกษาที่ 3 (ฤดูร้อน)</option>
              </NativeSelect>
            </Field>
            <Field label="ปีการศึกษา (พ.ศ.)" htmlFor="academicYear" required error={errors.academicYear?.message} className="sm:col-span-3">
              <Input
                id="academicYear"
                type="number"
                inputMode="numeric"
                min={2560}
                max={2700}
                aria-invalid={!!errors.academicYear}
                {...register("academicYear", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="สถานที่เรียน"
              htmlFor="venue"
              required
              error={errors.venue?.message}
              hint="พิมพ์ต่อจากคำว่า “ณ” ในหนังสือ เช่น ห้อง DT01 ชั้น 8 อาคาร…"
              className="sm:col-span-6"
            >
              <Textarea id="venue" rows={2} aria-invalid={!!errors.venue} {...register("venue")} />
              <div className="flex flex-wrap gap-1.5">
                {VENUE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setValue("venue", preset.value, { shouldValidate: true, shouldDirty: true })}
                    className="h-6 cursor-pointer rounded-[var(--radius-chip)] border border-border bg-card px-2 text-[11px] text-neutral-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </Field>
          </CardContent>
        </Card>

        {/* 3. Schedule */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>3 · กำหนดการสอน (เอกสารแนบ)</CardTitle>
              <CardDescription>ระบบเรียงตามวันเวลาและคำนวณชั่วโมงจากเวลาเริ่ม-เลิกให้</CardDescription>
            </div>
            <Badge tone="brand">รวม {formatHours(totalHours, false)} ชม.</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {schedule.fields.map((field, index) => {
              const rowErrors = errors.schedule?.[index];
              const date = values.schedule?.[index]?.date ?? "";
              return (
                <fieldset key={field._key} className="rounded-[var(--radius-control)] border border-border p-3">
                  <legend className="px-1 text-xs font-medium text-neutral-600">
                    คาบที่ {index + 1}
                    {parseIsoDate(date) ? <span className="ml-2 text-muted-foreground">{formatScheduleDay(date, false)}</span> : null}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr_1fr_0.8fr]">
                    <Field label="วันที่" htmlFor={`schedule-${index}-date`} error={rowErrors?.date?.message}>
                      <Input id={`schedule-${index}-date`} type="date" aria-invalid={!!rowErrors?.date} {...register(`schedule.${index}.date`)} />
                    </Field>
                    <Field label="เริ่ม" htmlFor={`schedule-${index}-start`} error={rowErrors?.startTime?.message}>
                      <Input
                        id={`schedule-${index}-start`}
                        type="time"
                        aria-invalid={!!rowErrors?.startTime}
                        {...register(`schedule.${index}.startTime`, { onChange: () => recomputeHours(index) })}
                      />
                    </Field>
                    <Field label="สิ้นสุด" htmlFor={`schedule-${index}-end`} error={rowErrors?.endTime?.message}>
                      <Input
                        id={`schedule-${index}-end`}
                        type="time"
                        aria-invalid={!!rowErrors?.endTime}
                        {...register(`schedule.${index}.endTime`, { onChange: () => recomputeHours(index) })}
                      />
                    </Field>
                    <Field label="ชั่วโมง" htmlFor={`schedule-${index}-hours`} error={rowErrors?.hours?.message}>
                      <Input
                        id={`schedule-${index}-hours`}
                        type="number"
                        step={0.5}
                        min={0.5}
                        inputMode="decimal"
                        aria-invalid={!!rowErrors?.hours}
                        {...register(`schedule.${index}.hours`, { valueAsNumber: true })}
                      />
                    </Field>
                    <Field label="หัวข้อการสอน" htmlFor={`schedule-${index}-topic`} error={rowErrors?.topic?.message} className="sm:col-span-4">
                      <Textarea
                        id={`schedule-${index}-topic`}
                        rows={2}
                        placeholder="เช่น Physiology of mastication and swallowing"
                        aria-invalid={!!rowErrors?.topic}
                        {...register(`schedule.${index}.topic`)}
                      />
                    </Field>
                  </div>
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => schedule.insert(index + 1, { ...getValues(`schedule.${index}`), id: newRowId() })}
                      aria-label={`ทำสำเนาคาบที่ ${index + 1}`}
                    >
                      <Copy aria-hidden /> ทำสำเนา
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger-bg"
                      disabled={schedule.fields.length === 1}
                      onClick={() => schedule.remove(index)}
                      aria-label={`ลบคาบที่ ${index + 1}`}
                    >
                      <Trash2 aria-hidden /> ลบ
                    </Button>
                  </div>
                </fieldset>
              );
            })}
            {errors.schedule?.root?.message || errors.schedule?.message ? (
              <p role="alert" className="text-xs text-danger">
                {errors.schedule?.root?.message ?? errors.schedule?.message}
              </p>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => {
                const last = getValues("schedule").at(-1);
                schedule.append(last ? { ...last, id: newRowId(), topic: "" } : emptyScheduleItem(getValues("issueDate")));
              }}
              className="self-start"
            >
              <CalendarPlus aria-hidden /> เพิ่มคาบสอน
            </Button>
          </CardContent>
        </Card>

        {/* 4. Exam */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>4 · รายละเอียดการออกข้อสอบ</CardTitle>
              <CardDescription>รวมข้อความเกณฑ์การจัดทำข้อสอบในเอกสารแนบท้าย — ปิดได้ถ้าอาจารย์ไม่ต้องออกข้อสอบ</CardDescription>
            </div>
            <Controller
              control={control}
              name="includeExamSection"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="แสดงรายละเอียดการออกข้อสอบ" />
              )}
            />
          </CardHeader>
          {values.includeExamSection ? (
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="คะแนนต่อ 1 ชั่วโมงสอน" htmlFor="pointsPerHour" error={errors.pointsPerHour?.message}>
                <Input
                  id="pointsPerHour"
                  type="number"
                  step={0.5}
                  min={0.5}
                  inputMode="decimal"
                  aria-invalid={!!errors.pointsPerHour}
                  {...register("pointsPerHour", { valueAsNumber: true })}
                />
              </Field>
              <Field
                label="กำหนดส่งข้อสอบภายใน"
                htmlFor="examDeadline"
                required
                error={errors.examDeadline?.message}
                hint={parseIsoDate(values.examDeadline ?? "") ? formatFullThaiDate(values.examDeadline, th) : undefined}
              >
                <Input id="examDeadline" type="date" aria-invalid={!!errors.examDeadline} {...register("examDeadline")} />
              </Field>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-xs text-muted-foreground">
                  คะแนนข้อสอบแต่ละคาบ = ชั่วโมง × {formatHours(pointsPerHour, false)} (คำนวณให้อัตโนมัติ) · แก้เองได้ถ้าวิชามีเกณฑ์พิเศษ · ใส่ 0
                  สำหรับคาบที่ไม่ใช่บรรยาย เช่น แล็บ
                </p>
                <div className="overflow-x-auto rounded-[var(--radius-control)] border border-border scrollbar-thin">
                  <table className="w-full min-w-[520px] text-left text-[13px]">
                    <thead className="bg-neutral-50 text-xs text-neutral-500">
                      <tr className="h-8">
                        <th scope="col" className="px-2.5 font-medium">วัน/ เวลา</th>
                        <th scope="col" className="px-2.5 font-medium">หัวข้อการสอน</th>
                        <th scope="col" className="px-2.5 text-right font-medium">ชั่วโมง</th>
                        <th scope="col" className="w-32 px-2.5 text-right font-medium">คะแนนที่ต้องส่ง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(values.schedule ?? []).map((row, index) => {
                        const auto = Math.round((Number.isFinite(row?.hours) ? row.hours : 0) * pointsPerHour * 100) / 100;
                        const points = row ? sessionExamPoints({ ...row, hours: Number.isFinite(row.hours) ? row.hours : 0 }, pointsPerHour) : 0;
                        return (
                          <tr key={row?.id ?? index} className="border-t border-border align-middle">
                            <td className="px-2.5 py-1.5 text-xs whitespace-nowrap text-neutral-600">
                              {parseIsoDate(row?.date ?? "") ? formatScheduleDay(row.date, false) : "—"}
                              <span className="block tabular">
                                {row?.startTime}–{row?.endTime}
                              </span>
                            </td>
                            <td className="max-w-[220px] truncate px-2.5 py-1.5" title={row?.topic}>
                              {row?.topic || <span className="text-neutral-400">(ยังไม่มีหัวข้อ)</span>}
                            </td>
                            <td className="px-2.5 py-1.5 text-right tabular">{Number.isFinite(row?.hours) ? formatHours(row.hours, false) : "—"}</td>
                            <td className="px-2.5 py-1.5">
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  step={0.5}
                                  aria-label={`คะแนนข้อสอบคาบที่ ${index + 1}`}
                                  className={cn("h-7 w-20 text-right", row?.examPointsEdited && "border-brand-300 bg-brand-50")}
                                  value={Number.isFinite(points) ? points : ""}
                                  onChange={(e) => {
                                    const n = e.target.value === "" ? 0 : Number(e.target.value);
                                    if (!Number.isFinite(n) || n < 0) return;
                                    setValue(`schedule.${index}.examPoints`, n, { shouldDirty: true });
                                    setValue(`schedule.${index}.examPointsEdited`, true, { shouldDirty: true });
                                  }}
                                />
                                {row?.examPointsEdited ? (
                                  <button
                                    type="button"
                                    title={`คืนค่าอัตโนมัติ (${formatHours(auto, false)})`}
                                    aria-label={`คืนค่าคะแนนอัตโนมัติคาบที่ ${index + 1}`}
                                    className="cursor-pointer rounded p-0.5 text-neutral-400 hover:text-brand-700"
                                    onClick={() => {
                                      setValue(`schedule.${index}.examPoints`, undefined, { shouldDirty: true });
                                      setValue(`schedule.${index}.examPointsEdited`, false, { shouldDirty: true });
                                    }}
                                  >
                                    <RotateCcw className="size-3.5" aria-hidden />
                                  </button>
                                ) : (
                                  <span className="w-[18px]" aria-hidden />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-neutral-50 font-medium">
                        <td className="px-2.5 py-1.5" colSpan={2}>
                          รวมชั่วโมงบรรยาย
                        </td>
                        <td className="px-2.5 py-1.5 text-right tabular">{formatHours(exam.lectureHours, false)}</td>
                        <td className="px-2.5 py-1.5 text-right tabular">
                          {formatHours(exam.points, false)} คะแนน
                          <span className="inline-block w-[22px]" aria-hidden />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <p className="rounded-[var(--radius-control)] bg-neutral-50 px-3 py-2 text-xs text-neutral-700 sm:col-span-2">
                ในเอกสาร: “ข้อสอบรายวิชาบรรยาย คิดเป็น ({formatHours(pointsPerHour, th)} คะแนน/ {th ? "๑" : "1"} ชั่วโมงการสอน) กรณีสอนบรรยาย{" "}
                {formatHours(exam.lectureHours, th)} ชั่วโมง รบกวนขอ {formatHours(exam.points, th)} คะแนน”
              </p>
            </CardContent>
          ) : null}
        </Card>

        {/* 5. Coordinator */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>5 · ผู้ประสานงาน</CardTitle>
              <CardDescription>ระบบจำไว้ให้ ไม่ต้องกรอกซ้ำในฉบับถัดไป</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <Field label="คำนำหน้า" htmlFor="coordinatorTitle" required>
              <NativeSelect id="coordinatorTitle" {...register("coordinatorTitle")}>
                {COORDINATOR_TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label="ชื่อ-นามสกุล"
              htmlFor="coordinatorName"
              required
              error={errors.coordinatorName?.message}
              hint={values.coordinatorTitle === "นางสาว" ? "ในหนังสือใช้ “น.ส.” และในเอกสารแนบใช้ “นางสาว” ตามต้นฉบับ" : undefined}
            >
              <Input id="coordinatorName" aria-invalid={!!errors.coordinatorName} {...register("coordinatorName")} />
            </Field>
            <Field label="เบอร์โทรศัพท์" htmlFor="coordinatorPhone" required error={errors.coordinatorPhone?.message}>
              <Input
                id="coordinatorPhone"
                type="tel"
                inputMode="tel"
                placeholder="0xx-xxxx-xxx"
                aria-invalid={!!errors.coordinatorPhone}
                {...register("coordinatorPhone")}
              />
            </Field>
            <Field label="อีเมล" htmlFor="coordinatorEmail" required error={errors.coordinatorEmail?.message}>
              <Input
                id="coordinatorEmail"
                type="email"
                inputMode="email"
                placeholder="name@kmitl.ac.th"
                aria-invalid={!!errors.coordinatorEmail}
                {...register("coordinatorEmail")}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2 pb-6">
          <Button type="submit" size="lg" disabled={busy !== null}>
            {busy === "docx" ? <Loader2 className="animate-spin" aria-hidden /> : <FileText aria-hidden />}
            ดาวน์โหลด Word (.docx)
          </Button>
          <Button variant="secondary" size="lg" disabled={busy !== null} onClick={() => void download("pdf")()}>
            {busy === "pdf" ? <Loader2 className="animate-spin" aria-hidden /> : <FileType2 aria-hidden />}
            ดาวน์โหลด PDF
          </Button>
          <Button variant="secondary" size="lg" onClick={printLetter}>
            <Printer aria-hidden /> พิมพ์ / บันทึกเป็น PDF
          </Button>
          <Button variant="ghost" size="lg" onClick={startNewLetter} className="ml-auto">
            <RotateCcw aria-hidden /> เริ่มฉบับใหม่
          </Button>
        </div>
      </form>

      {/* Preview */}
      <aside aria-label="พรีวิวเอกสาร" className="xl:sticky xl:top-4">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">พรีวิว</p>
              {pdfMode === "browser" && letterData ? <Badge>{letterPageCount(letterLayout, letterData.schedule.length)} หน้า</Badge> : null}
              {pdfMode === "server" && preview.status === "ready" && pageCount ? <Badge>{pageCount} หน้า</Badge> : null}
              {pdfMode === "server" && previewStale ? <Badge tone="warning">มีการแก้ไข</Badge> : null}
              {pdfMode === "server" && preview.status === "loading" ? (
                <Badge tone="info">
                  <Loader2 className="animate-spin" aria-hidden /> กำลังสร้าง…
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {pdfMode === "server" ? (
                <>
                  <Button variant="ghost" size="sm" onClick={refreshPreview} aria-label="สร้างพรีวิวใหม่">
                    <RefreshCw aria-hidden /> อัปเดต
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={preview.status !== "ready"}
                    aria-label="ดาวน์โหลด PDF ที่แสดงอยู่"
                    onClick={() => {
                      if (preview.status === "ready") saveBlob(preview.blob, preview.fileName);
                    }}
                  >
                    <FileDown aria-hidden />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={printLetter} disabled={!letterData} aria-label="พิมพ์หนังสือ">
                  <Printer aria-hidden /> พิมพ์
                </Button>
              )}
            </div>
          </div>
          <div
            className={cn(
              "max-h-[calc(100dvh-170px)] overflow-y-auto bg-neutral-100 p-4 scrollbar-thin",
              pdfMode === "server" && previewStale && "opacity-70",
            )}
          >
            {pdfMode === "browser" && letterData ? (
              <LetterPreview data={letterData} protectedWords={letterWords} layout={letterLayout} />
            ) : pdfMode === "server" && preview.status === "ready" ? (
              <PdfViewer file={preview.blob} onPages={setPageCount} />
            ) : pdfMode === "server" && preview.status === "loading" ? (
              <Skeleton className="aspect-[1/1.414] w-full bg-neutral-200" />
            ) : pdfMode === "server" && preview.status === "error" ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <p className="text-sm font-medium text-danger">{preview.message}</p>
                <Button variant="secondary" size="sm" onClick={refreshPreview}>
                  <RefreshCw aria-hidden /> ลองใหม่
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                <FileText className="size-8 text-neutral-300" aria-hidden />
                <p className="text-sm font-medium text-neutral-700">กรอกข้อมูลให้ครบ แล้วพรีวิวจะแสดงอัตโนมัติ</p>
                <p className="text-xs text-muted-foreground">
                  {validation.success ? "กำลังเตรียมพรีวิว…" : (firstError(errorsFromZod(validation.error)) ?? "")}
                </p>
              </div>
            )}
          </div>
        </Card>
      </aside>
      {letterData ? <LetterPrintRoot data={letterData} protectedWords={letterWords} layout={letterLayout} /> : null}
      {measurer}
    </div>
  );
}

/** Turns a ZodError into a minimal nested-message object understood by firstError(). */
function errorsFromZod(error: { issues: { message: string }[] }): FieldErrors<InvitationInput> {
  const first = error.issues[0];
  return (first ? { root: { message: first.message, type: "zod" } } : {}) as FieldErrors<InvitationInput>;
}
