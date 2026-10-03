"use client";

import { useState } from "react";
import { ChevronDown, History, Megaphone, Pencil, Play, RotateCcw, Square, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/components/i18n/locale-provider";
import {
  ANNOUNCEMENT_LABELS,
  ANNOUNCEMENT_ORDER,
  ANNOUNCEMENT_WHEN,
  PLACEHOLDERS,
  isMinuteId,
  scriptFor,
  type AnnouncementId,
  type VoiceLanguage,
} from "@/lib/exam-timer/announcements";
import { formatClock } from "@/lib/exam-timer/timing";
import type { Bi } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import type { LogEntry, LogStatus, VoiceSettings } from "./use-announcer";

const STATUS_TEXT: Record<LogStatus, { th: string; en: string; tone: string }> = {
  ok: { th: "พูดแล้ว", en: "spoken", tone: "text-success" },
  partial: { th: "พูดบางภาษา", en: "partly spoken", tone: "text-warning" },
  "no-voice": { th: "ไม่มีเสียงพูด", en: "no voice", tone: "text-warning" },
  blocked: { th: "เบราว์เซอร์บล็อกเสียง", en: "blocked by browser", tone: "text-danger" },
  error: { th: "พูดไม่สำเร็จ", en: "failed", tone: "text-danger" },
  chime: { th: "เฉพาะเสียงกริ่ง", en: "chime only", tone: "text-muted-foreground" },
  muted: { th: "ปิดเสียงอยู่", en: "muted", tone: "text-muted-foreground" },
};

export interface VoicePanelProps {
  voice: VoiceSettings;
  onVoiceChange: (voice: VoiceSettings) => void;
  warnings: number[];
  onWarningsChange: (warnings: number[]) => void;
  supported: boolean;
  thVoices: SpeechSynthesisVoice[];
  enVoices: SpeechSynthesisVoice[];
  speaking: boolean;
  missingLanguages: ("th" | "en")[];
  log: LogEntry[];
  onPreview: (id: AnnouncementId) => void;
  onCustom: (text: Bi) => void;
  onStop: () => void;
}

/** Checkpoints, wording and voices for the spoken announcements. */
export function VoicePanel({
  voice,
  onVoiceChange,
  warnings,
  onWarningsChange,
  supported,
  thVoices,
  enVoices,
  speaking,
  missingLanguages,
  log,
  onPreview,
  onCustom,
  onStop,
}: VoicePanelProps) {
  const t = useT();
  const [editing, setEditing] = useState<AnnouncementId | null>(null);
  const [custom, setCustom] = useState<Bi>({ th: "", en: "" });
  const set = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => onVoiceChange({ ...voice, [key]: value });
  const needsThai = voice.language !== "en";
  const needsEnglish = voice.language !== "th";

  const isOn = (id: AnnouncementId) => (isMinuteId(id) ? warnings.includes(Number(id.slice(1))) : voice.moments[id]);
  const toggle = (id: AnnouncementId) => {
    if (isMinuteId(id)) {
      const minutes = Number(id.slice(1));
      onWarningsChange(isOn(id) ? warnings.filter((m) => m !== minutes) : [...warnings, minutes]);
    } else {
      set("moments", { ...voice.moments, [id]: !voice.moments[id] });
    }
  };
  const editScript = (id: AnnouncementId, lang: "th" | "en", text: string) => {
    const current = scriptFor(id, voice.scripts);
    set("scripts", { ...voice.scripts, [id]: { ...current, [lang]: text } });
  };
  const resetScript = (id: AnnouncementId) => {
    const next = { ...voice.scripts };
    delete next[id];
    set("scripts", next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label htmlFor="voice-enabled" className="flex items-center gap-1.5">
            <Megaphone className="size-3.5 text-brand-600" aria-hidden /> {t("ประกาศด้วยเสียงพูด", "Spoken announcements")}
          </Label>
          <p className="text-[11px] text-muted-foreground">
            {t("เสียงกริ่ง → เสียงพูด → คำบรรยายบนจอ ตามจุดเวลาที่เลือก", "Chime → spoken announcement → on-screen caption at each checkpoint")}
          </p>
        </div>
        <Switch id="voice-enabled" checked={voice.enabled} onCheckedChange={(v) => set("enabled", v)} disabled={!supported} />
      </div>

      {!supported ? (
        <p className="flex gap-1.5 rounded-[var(--radius-control)] bg-warning-bg px-2.5 py-2 text-[11px] text-warning">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {t("เบราว์เซอร์นี้ไม่รองรับเสียงพูด — ใช้ Microsoft Edge หรือ Google Chrome", "This browser cannot speak — use Microsoft Edge or Google Chrome")}
        </p>
      ) : null}

      <div className={cn("flex flex-col gap-3", !voice.enabled && "opacity-60")}>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted-foreground">{t("ภาษาที่พูด (คำบรรยายบนจอแสดงทั้งสองภาษาเสมอ)", "Spoken language (captions always show both)")}</span>
          <Segmented<VoiceLanguage>
            ariaLabel={t("ภาษาที่พูด", "Spoken language")}
            value={voice.language}
            onChange={(v) => set("language", v)}
            // i18n-exempt: language names shown in their own language
            options={[
              { value: "th-en", label: "ไทย → EN" }, // i18n-exempt
              { value: "en-th", label: "EN → ไทย" }, // i18n-exempt
              { value: "th", label: "ไทย" }, // i18n-exempt
              { value: "en", label: "EN" },
            ]}
          />
        </div>

        {voice.enabled && missingLanguages.length === 1 ? (
          <p className="text-[11px] text-warning">
            {missingLanguages[0] === "th"
              ? t("จะพูดเฉพาะภาษาอังกฤษจนกว่าจะมีเสียงภาษาไทย — คำบรรยายบนจอยังแสดงครบทั้งสองภาษา", "Only English will be spoken until a Thai voice is available — captions still show both languages")
              : t("จะพูดเฉพาะภาษาไทยจนกว่าจะมีเสียงภาษาอังกฤษ — คำบรรยายบนจอยังแสดงครบทั้งสองภาษา", "Only Thai will be spoken until an English voice is available — captions still show both languages")}
          </p>
        ) : null}
        {needsThai ? (
          <VoiceSelect
            label={t("เสียงภาษาไทย", "Thai voice")}
            voices={thVoices}
            value={voice.thVoice}
            onChange={(v) => set("thVoice", v)}
            missing={t(
              "เครื่องนี้ยังไม่มีเสียงภาษาไทย — เปิดด้วย Microsoft Edge (มีเสียง Premwadee/Niwat) หรือเพิ่ม Thai ใน Windows: Settings › Time & language › Speech",
              "No Thai voice on this computer — open in Microsoft Edge (Premwadee/Niwat voices) or add Thai in Windows: Settings › Time & language › Speech",
            )}
          />
        ) : null}
        {needsEnglish ? (
          <VoiceSelect
            label={t("เสียงภาษาอังกฤษ", "English voice")}
            voices={enVoices}
            value={voice.enVoice}
            onChange={(v) => set("enVoice", v)}
            missing={t("เครื่องนี้ไม่มีเสียงภาษาอังกฤษ", "No English voice on this computer")}
          />
        ) : null}

        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-[11px] text-muted-foreground">{t("ความเร็วเสียงพูด", "Speaking rate")}</span>
          <input
            type="range"
            min={0.7}
            max={1.2}
            step={0.05}
            value={voice.rate}
            onChange={(e) => set("rate", Number(e.target.value))}
            aria-label={t("ความเร็วเสียงพูด", "Speaking rate")}
            className="h-1.5 flex-1 cursor-pointer accent-brand-600"
          />
          <span className="w-10 text-right font-[family-name:var(--font-latin)] text-xs tabular">{voice.rate.toFixed(2)}×</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="voice-captions" className="text-xs font-normal">
            {t("แสดงคำประกาศบนจอ (สำหรับผู้ที่ไม่ได้ยินเสียง)", "Show captions on screen (for candidates who cannot hear)")}
          </Label>
          <Switch id="voice-captions" checked={voice.captions} onCheckedChange={(v) => set("captions", v)} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-muted-foreground">
          {t(
            "จุดเตือนและคำประกาศ — ติ๊กเพื่อเปิด กดชื่อเพื่อแก้ข้อความ กด ▶ เพื่อประกาศ/ฟัง (ระหว่างสอบจะถามยืนยันก่อน)",
            "Checkpoints and wording — tick to enable, click a name to edit, ▶ to play (asks first during an exam)",
          )}
        </span>
        <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border">
          {ANNOUNCEMENT_ORDER.map((id) => {
            const on = isOn(id);
            const script = scriptFor(id, voice.scripts);
            const edited = Boolean(voice.scripts[id]);
            const open = editing === id;
            return (
              <li key={id} className="text-xs">
                <div className="flex items-center gap-2 px-2.5 py-1.5">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(id)}
                    aria-label={t(ANNOUNCEMENT_LABELS[id])}
                    className="size-3.5 cursor-pointer accent-brand-600"
                  />
                  <button
                    type="button"
                    onClick={() => setEditing(open ? null : id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left"
                  >
                    <span className={cn("shrink-0 font-medium", on ? "text-neutral-800" : "text-neutral-400")}>{t(ANNOUNCEMENT_LABELS[id])}</span>
                    {edited ? <Pencil className="size-3 text-brand-600" aria-label={t("แก้ไขแล้ว", "edited")} /> : null}
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{t(script)}</span>
                    <ChevronDown className={cn("size-3.5 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreview(id)}
                    aria-label={t(`ฟังตัวอย่าง: ${ANNOUNCEMENT_LABELS[id].th}`, `Listen: ${ANNOUNCEMENT_LABELS[id].en}`)}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
                  >
                    <Play className="size-3.5" aria-hidden />
                  </button>
                </div>
                {open ? (
                  <div className="flex flex-col gap-2 border-t border-border bg-neutral-50 px-2.5 py-2">
                    {ANNOUNCEMENT_WHEN[id] ? (
                      <p className="text-[11px] text-muted-foreground">
                        {t("ประกาศเมื่อ: ", "Plays ")}
                        {t(ANNOUNCEMENT_WHEN[id]!)}
                      </p>
                    ) : null}
                    <ScriptField label="ภาษาไทย" lang="th" value={script.th} onChange={(text) => editScript(id, "th", text)} />
                    <ScriptField label="English" lang="en" value={script.en} onChange={(text) => editScript(id, "en", text)} />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>
                        {t("ใส่ค่าอัตโนมัติ:", "Placeholders:")}{" "}
                        {PLACEHOLDERS.map((p) => (
                          <span key={p.token} className="mr-2">
                            <code className="rounded bg-card px-1 font-[family-name:var(--font-mono)]">{p.token}</code> {t(p.meaning)}
                          </span>
                        ))}
                      </span>
                      {edited ? (
                        <button
                          type="button"
                          onClick={() => resetScript(id)}
                          className="ml-auto flex cursor-pointer items-center gap-1 text-brand-700 hover:underline"
                        >
                          <RotateCcw className="size-3" aria-hidden /> {t("ใช้ข้อความมาตรฐาน", "Restore standard wording")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {log.length ? (
        <details className="rounded-[var(--radius-control)] border border-border px-2.5 py-1.5 text-xs">
          <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-neutral-700">
            <History className="size-3.5" aria-hidden /> {t("ประวัติการประกาศ", "Announcement log")} ({log.length})
          </summary>
          <ul className="mt-1.5 flex max-h-40 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
            {log.map((entry) => (
              <li key={entry.key} className="flex gap-2">
                <span className="shrink-0 font-[family-name:var(--font-latin)] tabular text-muted-foreground">{formatClock(entry.at, true)}</span>
                <span className="min-w-0 flex-1 truncate">{t(entry.label)}</span>
                <span className={cn("shrink-0", STATUS_TEXT[entry.status].tone)}>{t(STATUS_TEXT[entry.status])}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-col gap-1.5 rounded-[var(--radius-control)] border border-dashed border-border p-2.5">
        <span className="text-[11px] font-medium text-neutral-700">{t("ประกาศข้อความเอง", "Make a custom announcement")}</span>
        <Textarea
          rows={2}
          lang="th"
          value={custom.th}
          onChange={(e) => setCustom((c) => ({ ...c, th: e.target.value }))}
          placeholder="เช่น ขอให้นักศึกษาปิดโทรศัพท์มือถือและวางไว้หน้าห้อง"
          aria-label={t("ข้อความภาษาไทย", "Thai text")}
          className="text-xs"
        />
        <Textarea
          rows={2}
          lang="en"
          value={custom.en}
          onChange={(e) => setCustom((c) => ({ ...c, en: e.target.value }))}
          placeholder="e.g. Please switch off your mobile phone and leave it at the front of the room."
          aria-label={t("ข้อความภาษาอังกฤษ", "English text")}
          className="text-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onCustom(custom)} disabled={!custom.th.trim() && !custom.en.trim()}>
            <Megaphone aria-hidden /> {t("ประกาศตอนนี้", "Announce now")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onStop} disabled={!speaking}>
            <Square aria-hidden /> {t("หยุดเสียงพูด", "Stop speaking")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VoiceSelect({
  label,
  voices,
  value,
  onChange,
  missing,
}: {
  label: string;
  voices: SpeechSynthesisVoice[];
  value: string;
  onChange: (value: string) => void;
  missing: string;
}) {
  const t = useT();
  if (!voices.length) {
    return (
      <p className="flex gap-1.5 rounded-[var(--radius-control)] bg-warning-bg px-2.5 py-2 text-[11px] text-warning">
        <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
        {missing}
      </p>
    );
  }
  const selected = voices.some((v) => v.voiceURI === value) ? value : "";
  return (
    <label className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <NativeSelect value={selected} onChange={(e) => onChange(e.target.value)} className="h-8 flex-1 text-xs">
        <option value="">
          {t("อัตโนมัติ", "Automatic")} — {voices[0]!.name}
        </option>
        {voices.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI}>
            {voice.name} ({voice.lang}){voice.localService ? "" : " · online"}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

function ScriptField({ label, lang, value, onChange }: { label: string; lang: "th" | "en"; value: string; onChange: (text: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-neutral-600">{label}</span>
      <Textarea rows={2} lang={lang} value={value} onChange={(e) => onChange(e.target.value)} className="bg-card text-xs" />
    </label>
  );
}
