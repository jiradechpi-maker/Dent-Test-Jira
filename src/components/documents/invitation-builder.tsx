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
  RefreshCw,
  RotateCcw,
  ServerOff,
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
import { COURSE_NAMES, COURSES_DATA, findCourseByName } from "@/data/course-catalog";
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
import { totalScheduleHours } from "@/lib/invitation/template-data";
import {
  formatFullThaiDate,
  formatHours,
  formatLetterDate,
  formatScheduleDay,
  hoursBetween,
  parseIsoDate,
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
  | { status: "unavailable"; message: string }
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
  const autoPreviewRef = useRef(true);

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
      if (error instanceof DocumentApiError && (error.status === 503 || error.status === 502)) {
        autoPreviewRef.current = false;
        setPreview({ status: "unavailable", message: error.message });
        return;
      }
      setPreview({ status: "error", message: error instanceof Error ? error.message : "สร้างพรีวิวไม่สำเร็จ" });
    }
  }, []);

  // Auto-refresh the PDF preview shortly after the user stops typing (only when the form is valid).
  useEffect(() => {
    if (!hydrated || !validation.success || !autoPreviewRef.current) return;
    if (preview.status === "ready" && preview.key === valuesKey) return;
    const data = validation.data;
    const id = window.setTimeout(() => void runPreview(data, valuesKey), PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preview is read only to skip duplicate work
  }, [hydrated, valuesKey, validation, runPreview]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const download = (format: DocumentFormat) =>
    handleSubmit(
      async (data) => {
        const key = JSON.stringify(data);
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

  const refreshPreview = () => {
    autoPreviewRef.current = true;
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

  const recomputeHours = (index: number) => {
    const row = getValues(`schedule.${index}`);
    const hours = hoursBetween(row.startTime, row.endTime);
    if (hours > 0) setValue(`schedule.${index}.hours`, hours, { shouldValidate: true, shouldDirty: true });
  };

  const th = values.thaiDigits !== false;
  const totalHours = totalScheduleHours((values.schedule ?? []).filter((s) => Number.isFinite(s?.hours)));
  const pointsPerHour = Number.isFinite(values.pointsPerHour) ? values.pointsPerHour : 0;
  const issueDateText = parseIsoDate(values.issueDate ?? "")
    ? formatLetterDate(values.issueDate, { includeDay: values.includeIssueDay, thaiDigits: th })
    : "—";

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
            <Field label="วันที่ออกหนังสือ" htmlFor="issueDate" required error={errors.issueDate?.message} hint={`พิมพ์เป็น: ${issueDateText}`}>
              <Input id="issueDate" type="date" aria-invalid={!!errors.issueDate} {...register("issueDate")} />
            </Field>
            <div className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border px-3 py-2">
              <div>
                <Label htmlFor="includeIssueDay">ระบุวันที่ในหนังสือ</Label>
                <p className="text-[11px] text-muted-foreground">ปิด = เว้นช่องวันที่ไว้ให้สารบรรณเติม</p>
              </div>
              <Controller
                control={control}
                name="includeIssueDay"
                render={({ field }) => <Switch id="includeIssueDay" checked={field.value} onCheckedChange={field.onChange} />}
              />
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
              <CardDescription>เลือกรายวิชาจากรายการ ระบบเติมชั้นปีและภาคเรียนให้</CardDescription>
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
            <Field label="ชื่อรายวิชา (ภาษาอังกฤษ)" htmlFor="courseName" required error={errors.courseName?.message} className="sm:col-span-6">
              <Input
                id="courseName"
                list="course-catalog"
                placeholder="พิมพ์เพื่อค้นหา เช่น Fixed Prosthodontics"
                aria-invalid={!!errors.courseName}
                {...register("courseName", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => onCourseChange(e.target.value) })}
              />
              <datalist id="course-catalog">
                {COURSE_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label="ภาคการศึกษา" htmlFor="semester" required className="sm:col-span-2">
              <NativeSelect id="semester" {...register("semester")}>
                <option value="1">ภาคการศึกษาที่ 1</option>
                <option value="2">ภาคการศึกษาที่ 2</option>
                <option value="3">ภาคการศึกษาที่ 3 (ฤดูร้อน)</option>
              </NativeSelect>
            </Field>
            <Field label="ปีการศึกษา (พ.ศ.)" htmlFor="academicYear" required error={errors.academicYear?.message} className="sm:col-span-2">
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
            <Field label="ชั้นปีของนักศึกษา" htmlFor="studentYear" required className="sm:col-span-2">
              <NativeSelect id="studentYear" {...register("studentYear", { valueAsNumber: true })}>
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>
                    ชั้นปีที่ {y}
                  </option>
                ))}
              </NativeSelect>
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
              <CardDescription>แสดงท้ายเอกสารแนบ — ปิดได้ถ้าอาจารย์ไม่ต้องออกข้อสอบ</CardDescription>
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
              <p className="rounded-[var(--radius-control)] bg-neutral-50 px-3 py-2 text-xs text-neutral-700 sm:col-span-2">
                ในเอกสาร: “กรณีสอนบรรยาย {formatHours(totalHours, th)} ชั่วโมง รบกวนขอ{" "}
                {formatHours(Math.round(totalHours * pointsPerHour * 100) / 100, th)} คะแนน”
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
              <p className="text-sm font-semibold">พรีวิว PDF</p>
              {preview.status === "ready" && pageCount ? <Badge>{pageCount} หน้า</Badge> : null}
              {previewStale ? <Badge tone="warning">มีการแก้ไข</Badge> : null}
              {preview.status === "loading" ? (
                <Badge tone="info">
                  <Loader2 className="animate-spin" aria-hidden /> กำลังสร้าง…
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
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
            </div>
          </div>
          <div className={cn("max-h-[calc(100dvh-170px)] overflow-y-auto bg-neutral-100 p-4 scrollbar-thin", previewStale && "opacity-70")}>
            {preview.status === "ready" ? (
              <PdfViewer file={preview.blob} onPages={setPageCount} />
            ) : preview.status === "loading" ? (
              <Skeleton className="aspect-[1/1.414] w-full bg-neutral-200" />
            ) : preview.status === "unavailable" ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <ServerOff className="size-8 text-neutral-400" aria-hidden />
                <p className="text-sm font-medium text-neutral-800">ยังไม่ได้เชื่อมต่อบริการแปลง PDF</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {preview.message}
                  <br />
                  พรีวิวต้องมาจาก PDF จริงเท่านั้น เพื่อให้ตรงกับไฟล์ที่ดาวน์โหลด — ระหว่างนี้ดาวน์โหลด .docx ได้ตามปกติ
                </p>
                <Button variant="secondary" size="sm" onClick={refreshPreview}>
                  <RefreshCw aria-hidden /> ลองใหม่
                </Button>
              </div>
            ) : preview.status === "error" ? (
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
    </div>
  );
}

/** Turns a ZodError into a minimal nested-message object understood by firstError(). */
function errorsFromZod(error: { issues: { message: string }[] }): FieldErrors<InvitationInput> {
  const first = error.issues[0];
  return (first ? { root: { message: first.message, type: "zod" } } : {}) as FieldErrors<InvitationInput>;
}
