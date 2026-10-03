"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captionFor } from "@/lib/exam-timer/announcements";
import { CHIME_STYLES, playChime, unlockAudio, type ChimeStyle } from "@/lib/exam-timer/sounds";
import type { Bi } from "@/lib/i18n/locale";

export interface AnnounceSettings {
  /** Chime and show the 5-minute warning. */
  fiveMinutes: boolean;
  /** Thai wording (empty = the standard wording). */
  text: string;
  chime: ChimeStyle;
}

export const DEFAULT_ANNOUNCE: AnnounceSettings = {
  fiveMinutes: true,
  text: "",
  chime: "dingdong",
};

/** Settings saved by any version, including the ones that also stored a voice and a speaking speed. */
export function normalizeAnnounce(value: unknown): AnnounceSettings {
  const v = (typeof value === "object" && value !== null ? value : {}) as Partial<AnnounceSettings> & { voiceUri?: unknown; rate?: unknown };
  let chime = (CHIME_STYLES as readonly string[]).includes(v.chime as string) ? (v.chime as ChimeStyle) : DEFAULT_ANNOUNCE.chime;
  // In the version that spoke, "no chime" meant "voice only"; with the voice gone it would leave the warning silent.
  if (chime === "none" && ("voiceUri" in v || "rate" in v)) chime = DEFAULT_ANNOUNCE.chime;
  return {
    fiveMinutes: typeof v.fiveMinutes === "boolean" ? v.fiveMinutes : DEFAULT_ANNOUNCE.fiveMinutes,
    text: typeof v.text === "string" ? v.text : "",
    chime,
  };
}

export interface Caption {
  key: number;
  text: Bi;
}

export interface AnnounceOptions {
  settings: AnnounceSettings;
  /** Master sound switch: off = words on screen only, no chime. */
  sound: boolean;
  /** How long the words stay on the projector. */
  showForMs: number;
}

function clearTimer(timer: { current: number | null }) {
  if (timer.current !== null) window.clearTimeout(timer.current);
  timer.current = null;
}

/** The 5-minute warning: a chime, and the words on the projector for the invigilator to read out. */
export function useAnnouncer() {
  const [caption, setCaption] = useState<Caption | null>(null);
  const sequence = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => clearTimer(timer), []);

  /** Shows the words and plays the chime. Returns false when the chime could not play (audio still locked). */
  const announce = useCallback(async ({ settings, sound, showForMs }: AnnounceOptions): Promise<boolean> => {
    const id = ++sequence.current;
    setCaption({ key: id, text: captionFor(settings.text) });
    clearTimer(timer);
    timer.current = window.setTimeout(() => {
      if (id === sequence.current) setCaption(null);
    }, showForMs);
    if (!sound || settings.chime === "none") return true;
    // Wakes an audio engine the browser suspended (e.g. after a reload); works once the page has had a click.
    const ok = await unlockAudio();
    if (id !== sequence.current) return true;
    return ok && playChime(settings.chime) > 0;
  }, []);

  /** Takes the words off the screen. */
  const dismiss = useCallback(() => {
    sequence.current += 1;
    clearTimer(timer);
    setCaption(null);
  }, []);

  return { caption, announce, dismiss };
}
