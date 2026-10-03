"use client";

import { useState } from "react";
import { Bell, CircleCheck, Loader2, Megaphone, Play, RotateCcw, Square, TriangleAlert, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/components/i18n/locale-provider";
import { FIVE_MINUTE_TEXT } from "@/lib/exam-timer/announcements";
import { CHIME_LABELS, CHIME_STYLES, type ChimeStyle } from "@/lib/exam-timer/sounds";
import { voiceLabel, type SpeakResult } from "@/lib/exam-timer/speech";
import { cn } from "@/lib/utils";
import { RATE_OPTIONS, type AnnounceSettings } from "./use-announcer";

export interface SoundSettingsProps {
  announce: AnnounceSettings;
  onAnnounceChange: (announce: AnnounceSettings) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  sound: boolean;
  onSoundChange: (sound: boolean) => void;
  supported: boolean;
  voicesLoaded: boolean;
  voices: SpeechSynthesisVoice[];
  speaking: boolean;
  result: SpeakResult | null;
  onTest: () => void;
  onTestChime: (style: ChimeStyle) => void;
  onStop: () => void;
}

const RATE_LABELS: Record<(typeof RATE_OPTIONS)[number], { th: string; en: string }> = {
  0.8: { th: "ช้า", en: "Slow" },
  0.9: { th: "ปกติ", en: "Normal" },
  1.0: { th: "เร็ว", en: "Fast" },
};

/** Sound for the exam room: one optional spoken 5-minute warning, a voice, a chime and the volume — each with a test button. */
export function SoundSettings({
  announce,
  onAnnounceChange,
  volume,
  onVolumeChange,
  sound,
  onSoundChange,
  supported,
  voicesLoaded,
  voices,
  speaking,
  result,
  onTest,
  onTestChime,
  onStop,
}: SoundSettingsProps) {
  const t = useT();
  // The text box edits a local draft so it can be emptied while typing; an empty or standard text is saved as "".
  const [draft, setDraft] = useState<string | null>(null);
  const set = <K extends keyof AnnounceSettings>(key: K, value: AnnounceSettings[K]) => onAnnounceChange({ ...announce, [key]: value });
  const saveDraft = (value: string) => {
    setDraft(value);
    set("text", value.trim() === "" || value.trim() === FIVE_MINUTE_TEXT ? "" : value);
  };
  const selectedVoice = voices.find((v) => v.voiceURI === announce.voiceUri) ?? voices[0] ?? null;
  const text = announce.text.trim() || FIVE_MINUTE_TEXT;
  const noThaiVoice = supported && voicesLoaded && voices.length === 0;
  const hasNatural = voices.some((v) => /natural|online/i.test(v.name));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="timer-sound" className="flex items-center gap-1.5">
          {sound ? <Volume2 className="size-4 text-brand-600" aria-hidden /> : <VolumeX className="size-4 text-neutral-400" aria-hidden />}
          {t("เปิดเสียง", "Sound on")}
        </Label>
        <Switch id="timer-sound" checked={sound} onCheckedChange={onSoundChange} />
      </div>

      {speaking ? (
        <Button variant="secondary" onClick={onStop} className="w-full">
          <Square aria-hidden /> {t("หยุดเสียงประกาศ", "Stop the announcement")}
        </Button>
      ) : null}

      <div inert={!sound} className={cn("flex flex-col gap-4", !sound && "opacity-50")}>
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-muted-foreground">{t("ความดัง", "Volume")}</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label={t("ความดัง", "Volume")}
            className="h-1.5 flex-1 cursor-pointer accent-brand-600"
          />
          <span className="w-9 text-right font-[family-name:var(--font-latin)] text-xs tabular">{Math.round(volume * 100)}%</span>
        </div>

        <div className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <Label htmlFor="announce-five" className="flex items-start gap-1.5 leading-snug">
              <Megaphone className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              {t("ประกาศเสียงเมื่อเหลือเวลาสอบ 5 นาที", "Spoken warning at 5 minutes left")}
            </Label>
            <Switch id="announce-five" checked={announce.fiveMinutes} onCheckedChange={(v) => set("fiveMinutes", v)} />
          </div>

          {announce.fiveMinutes ? (
            <>
              {draft !== null ? (
                <div className="flex flex-col gap-1.5">
                  <Textarea
                    rows={3}
                    lang="th"
                    value={draft}
                    onChange={(e) => saveDraft(e.target.value)}
                    aria-label={t("ข้อความที่จะประกาศ", "Announcement text")}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-3 text-xs">
                    <button type="button" onClick={() => setDraft(null)} className="cursor-pointer font-medium text-brand-700 hover:underline">
                      {t("เสร็จ", "Done")}
                    </button>
                    {announce.text ? (
                      <button
                        type="button"
                        onClick={() => saveDraft(FIVE_MINUTE_TEXT)}
                        className="flex cursor-pointer items-center gap-1 text-muted-foreground hover:text-neutral-800"
                      >
                        <RotateCcw className="size-3" aria-hidden /> {t("ใช้ข้อความเดิม", "Use the standard wording")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p lang="th" className="rounded-[var(--radius-control)] bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-800">
                  “{text}”{" "}
                  <button type="button" onClick={() => setDraft(text)} className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">
                    {t("แก้ข้อความ", "Edit")}
                  </button>
                </p>
              )}

              {!supported ? (
                <p className="flex gap-1.5 rounded-[var(--radius-control)] bg-warning-bg px-3 py-2 text-xs leading-relaxed text-warning">
                  <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
                  {t("เบราว์เซอร์นี้พูดไม่ได้ — เปิดหน้านี้ด้วย Microsoft Edge", "This browser can't speak — open this page in Microsoft Edge.")}
                </p>
              ) : noThaiVoice ? (
                <p className="flex gap-1.5 rounded-[var(--radius-control)] bg-warning-bg px-3 py-2 text-xs leading-relaxed text-warning">
                  <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
                  <span>
                    {announce.chime === "none"
                      ? t(
                          "เครื่องนี้ยังไม่มีเสียงพูดภาษาไทย และไม่ได้เลือกเสียงกริ่ง ตอนเหลือ 5 นาทีจะขึ้นแค่ข้อความบนจอ — แนะนำเปิดหน้านี้ด้วย Microsoft Edge ซึ่งมีเสียงไทย 2 เสียง (หญิง/ชาย)",
                          "No Thai voice on this computer and no chime selected, so at 5 minutes only the on-screen text appears — open this page in Microsoft Edge, which has two Thai voices (female/male).",
                        )
                      : t(
                          "เครื่องนี้ยังไม่มีเสียงพูดภาษาไทย ตอนเหลือ 5 นาทีจะมีแค่เสียงกริ่งและข้อความบนจอ — แนะนำเปิดหน้านี้ด้วย Microsoft Edge ซึ่งมีเสียงไทย 2 เสียง (หญิง/ชาย)",
                          "No Thai voice on this computer, so at 5 minutes only the chime and on-screen text will play — open this page in Microsoft Edge, which has two Thai voices (female/male).",
                        )}
                  </span>
                </p>
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t(`เสียงผู้พูด (มี ${voices.length} เสียงในเครื่องนี้)`, `Voice (${voices.length} on this computer)`)}
                  </span>
                  <NativeSelect value={selectedVoice?.voiceURI ?? ""} onChange={(e) => set("voiceUri", e.target.value)} disabled={!supported}>
                    {voices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voiceLabel(voice, t.locale)}
                      </option>
                    ))}
                  </NativeSelect>
                  {voices.length && !hasNatural ? (
                    <span className="text-[11px] text-muted-foreground">
                      {t(
                        "อยากได้เสียงเพิ่ม: เปิดหน้านี้ด้วย Microsoft Edge จะมีเสียงไทยแบบธรรมชาติเพิ่มอีก 2 เสียง",
                        "For more voices, open this page in Microsoft Edge — it adds two natural-sounding Thai voices.",
                      )}
                    </span>
                  ) : null}
                </label>
              )}

              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{t("ความเร็ว", "Speed")}</span>
                <div role="group" aria-label={t("ความเร็วเสียงพูด", "Speaking speed")} className="inline-flex flex-1 rounded-[var(--radius-control)] bg-neutral-100 p-0.5">
                  {RATE_OPTIONS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      aria-pressed={announce.rate === rate}
                      onClick={() => set("rate", rate)}
                      className={cn(
                        "h-7 flex-1 cursor-pointer rounded-[6px] text-xs font-medium transition-colors",
                        announce.rate === rate ? "bg-card text-neutral-900 shadow-[var(--shadow-sm)]" : "text-neutral-500 hover:text-neutral-800",
                      )}
                    >
                      {t(RATE_LABELS[rate])}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{t("เสียงกริ่ง", "Chime")}</span>
                <NativeSelect
                  value={announce.chime}
                  onChange={(e) => set("chime", e.target.value as ChimeStyle)}
                  aria-label={t("เสียงกริ่งก่อนประกาศ", "Chime before the announcement")}
                  className="flex-1"
                >
                  {CHIME_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {t(CHIME_LABELS[style])}
                    </option>
                  ))}
                </NativeSelect>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => onTestChime(announce.chime)}
                  disabled={announce.chime === "none"}
                  aria-label={t("ฟังเสียงกริ่ง", "Play the chime")}
                  title={t("ฟังเสียงกริ่ง", "Play the chime")}
                >
                  <Bell aria-hidden />
                </Button>
              </div>

              <Button onClick={() => !speaking && onTest()} aria-disabled={speaking} className={cn("w-full", speaking && "opacity-70")}>
                {speaking ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
                {speaking ? t("กำลังประกาศ…", "Announcing…") : t("ทดลองฟังประกาศ", "Test the announcement")}
              </Button>

              <div role="status" aria-live="polite">
                <TestResult result={result} />
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("ปิดอยู่ — เมื่อเหลือ 5 นาที จอจะเปลี่ยนเป็นสีส้มอย่างเดียว ไม่มีเสียงประกาศ", "Off — at 5 minutes the screen only turns orange, with no announcement.")}
            </p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {t("เสียงอัตโนมัติอื่น: กริ่ง “ดิ๊ง-ด่อง” ตอนเริ่มสอบ และกริ่งยาวตอนหมดเวลา", "Other automatic sounds: a ding-dong at the start and a long bell when time is up.")}
        </p>
      </div>
    </div>
  );
}

function TestResult({ result }: { result: SpeakResult | null }) {
  const t = useT();
  if (!result) return null;
  if (result.status === "ok") {
    return (
      <p className="flex gap-1.5 text-xs text-success">
        <CircleCheck className="mt-px size-3.5 shrink-0" aria-hidden />
        {t(
          `พูดด้วยเสียง ${result.voice ? voiceLabel(result.voice, "th") : ""} แล้ว — ถ้าไม่ได้ยิน ให้เพิ่มเสียงที่ลำโพงหรือเครื่อง`,
          `Spoken with ${result.voice ? voiceLabel(result.voice, "en") : "the selected voice"} — if you heard nothing, turn up the speakers.`,
        )}
      </p>
    );
  }
  if (result.status === "stopped") return null;
  const message =
    result.status === "blocked"
      ? t("เบราว์เซอร์ยังไม่อนุญาตให้เล่นเสียง — กด “ทดลองฟังประกาศ” อีกครั้ง", "The browser blocked the sound — press “Test the announcement” again.")
      : result.status === "silent"
        ? t("ไม่มีเสียงพูดออกมา — ลองเลือกเสียงอื่น หรือเปิดหน้านี้ด้วย Microsoft Edge", "No speech came out — try another voice, or open this page in Microsoft Edge.")
        : result.status === "error"
        ? t("พูดไม่สำเร็จ — ลองเลือกเสียงอื่น หรือตรวจอินเทอร์เน็ต (เสียงธรรมชาติต้องใช้อินเทอร์เน็ต)", "Couldn't speak — try another voice or check the internet (natural voices need it).")
        : result.status === "unsupported"
          ? t("เบราว์เซอร์นี้พูดไม่ได้ — ใช้ Microsoft Edge หรือ Google Chrome", "This browser can't speak — use Microsoft Edge or Google Chrome.")
          : t("เครื่องนี้ไม่มีเสียงพูดภาษาไทย — เปิดหน้านี้ด้วย Microsoft Edge", "No Thai voice on this computer — open this page in Microsoft Edge.");
  return (
    <p className="flex gap-1.5 text-xs text-danger">
      <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
