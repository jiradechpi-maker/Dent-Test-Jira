"use client";

import { useState } from "react";
import { BellRing, Megaphone, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/components/i18n/locale-provider";
import { FIVE_MINUTE_TEXT, announcementText } from "@/lib/exam-timer/announcements";
import { CHIME_LABELS, CHIME_STYLES, type ChimeStyle } from "@/lib/exam-timer/sounds";
import { cn } from "@/lib/utils";
import type { AnnounceSettings } from "./use-announcer";

export interface SoundSettingsProps {
  announce: AnnounceSettings;
  onAnnounceChange: (announce: AnnounceSettings) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  sound: boolean;
  onSoundChange: (sound: boolean) => void;
  /** Chime + the words on the screen for a few seconds. */
  onTest: () => void;
}

/** Sound for the exam room: the master switch and volume, and the 5-minute warning (a chime and words on the screen). */
export function SoundSettings({ announce, onAnnounceChange, volume, onVolumeChange, sound, onSoundChange, onTest }: SoundSettingsProps) {
  const t = useT();
  // The text box edits a local draft so it can be emptied while typing; an empty or standard text is saved as "".
  const [draft, setDraft] = useState<string | null>(null);
  const set = <K extends keyof AnnounceSettings>(key: K, value: AnnounceSettings[K]) => onAnnounceChange({ ...announce, [key]: value });
  const saveDraft = (value: string) => {
    setDraft(value);
    set("text", value.trim() === "" || value.trim() === FIVE_MINUTE_TEXT ? "" : value);
  };
  const text = announcementText(announce.text);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="timer-sound" className="flex items-center gap-1.5">
          {sound ? <Volume2 className="size-4 text-brand-600" aria-hidden /> : <VolumeX className="size-4 text-neutral-400" aria-hidden />}
          {t("เปิดเสียงกริ่ง", "Chimes on")}
        </Label>
        <Switch id="timer-sound" checked={sound} onCheckedChange={onSoundChange} />
      </div>

      <div inert={!sound} className={cn("flex items-center gap-3", !sound && "opacity-50")}>
        <span className="w-16 shrink-0 text-xs text-muted-foreground">{t("ความดัง", "Volume")}</span>
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
            {t("เตือนเมื่อเหลือเวลาสอบ 5 นาที", "Warn at 5 minutes left")}
          </Label>
          <Switch id="announce-five" checked={announce.fiveMinutes} onCheckedChange={(v) => set("fiveMinutes", v)} />
        </div>

        {announce.fiveMinutes ? (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(
                "ดังกริ่ง แล้วขึ้นข้อความนี้บนจอ 1 นาที ให้กรรมการคุมสอบอ่านประกาศ:",
                "A chime, then these words on the screen for a minute for the invigilator to read out:",
              )}
            </p>
            {draft !== null ? (
              <div className="flex flex-col gap-1.5">
                <Textarea
                  rows={3}
                  lang="th"
                  value={draft}
                  onChange={(e) => saveDraft(e.target.value)}
                  aria-label={t("ข้อความเตือนบนจอ", "Warning text on screen")}
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

            <div inert={!sound} className={cn("flex items-center gap-2", !sound && "opacity-50")}>
              <BellRing className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <NativeSelect
                value={announce.chime}
                onChange={(e) => set("chime", e.target.value as ChimeStyle)}
                aria-label={t("เสียงกริ่งเตือน 5 นาที", "5-minute chime")}
                className="flex-1"
              >
                {CHIME_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {t(CHIME_LABELS[style])}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <Button variant="secondary" onClick={onTest} className="w-full">
              <Play aria-hidden /> {t("ทดลอง (กริ่ง + ข้อความบนจอ)", "Try it (chime + on-screen text)")}
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("ปิดอยู่ — เมื่อเหลือ 5 นาที ตัวเลขบนจอจะเปลี่ยนเป็นสีส้มอย่างเดียว", "Off — at 5 minutes the countdown only turns orange.")}
          </p>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {t("เสียงอัตโนมัติอื่น: กริ่ง “ดิ๊ง-ด่อง” ตอนเริ่มสอบ และกริ่งยาวตอนหมดเวลา", "Other automatic sounds: a ding-dong at the start and a long bell when time is up.")}
      </p>
    </div>
  );
}
