"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { announcementText, captionFor, speakableThai } from "@/lib/exam-timer/announcements";
import { CHIME_STYLES, playChime, unlockAudio, type ChimeStyle } from "@/lib/exam-timer/sounds";
import { loadVoices, onVoicesChanged, speakThai, speechSupported, stopSpeaking, thaiVoices, type SpeakResult } from "@/lib/exam-timer/speech";
import type { Bi } from "@/lib/i18n/locale";

export interface AnnounceSettings {
  /** Speak the 5-minute warning. */
  fiveMinutes: boolean;
  /** Thai wording (empty = the standard wording). */
  text: string;
  /** Chosen Thai voice ("" = the best one on this computer). */
  voiceUri: string;
  rate: number;
  chime: ChimeStyle;
}

export const RATE_OPTIONS = [0.8, 0.95, 1.1] as const;

export const DEFAULT_ANNOUNCE: AnnounceSettings = {
  fiveMinutes: true,
  text: "",
  voiceUri: "",
  rate: 0.95,
  chime: "dingdong",
};

export function normalizeAnnounce(value: unknown): AnnounceSettings {
  const v = (typeof value === "object" && value !== null ? value : {}) as Partial<AnnounceSettings>;
  return {
    fiveMinutes: typeof v.fiveMinutes === "boolean" ? v.fiveMinutes : DEFAULT_ANNOUNCE.fiveMinutes,
    text: typeof v.text === "string" ? v.text : "",
    voiceUri: typeof v.voiceUri === "string" ? v.voiceUri : "",
    rate: (RATE_OPTIONS as readonly number[]).includes(v.rate as number) ? (v.rate as number) : DEFAULT_ANNOUNCE.rate,
    chime: (CHIME_STYLES as readonly string[]).includes(v.chime as string) ? (v.chime as ChimeStyle) : DEFAULT_ANNOUNCE.chime,
  };
}

export interface Caption {
  key: number;
  text: Bi;
}

export interface AnnounceOptions {
  settings: AnnounceSettings;
  volume: number;
  /** Master sound switch: off = words on screen only, no chime or voice. */
  sound: boolean;
  /** Show the words on the projector (off for a quiet test before the exam). */
  caption: boolean;
}

/** Edge adds its online voices a moment after the first list arrives; wait this long before saying "no Thai voice". */
const VOICE_GRACE_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function useAnnouncer() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [supported, setSupported] = useState(true);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [result, setResult] = useState<SpeakResult | null>(null);
  /** Bumped by every announcement and by Stop; a superseded announcement stops at its next step. */
  const sequence = useRef(0);
  /** Separate from `sequence` so a quiet test never cancels the hiding of a caption already on screen. */
  const captionSeq = useRef(0);
  const captionTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!speechSupported()) {
      setSupported(false);
      setVoicesLoaded(true);
      return;
    }
    let alive = true;
    let grace: number | null = null;
    void loadVoices().then((list) => {
      if (!alive) return;
      setVoices(list);
      grace = window.setTimeout(() => alive && setVoicesLoaded(true), VOICE_GRACE_MS);
    });
    const off = onVoicesChanged(() => setVoices(window.speechSynthesis.getVoices()));
    return () => {
      alive = false;
      if (grace !== null) window.clearTimeout(grace);
      off();
      stopSpeaking();
    };
  }, []);

  const hideCaptionAfter = useCallback((id: number, ms: number) => {
    if (captionTimer.current !== null) window.clearTimeout(captionTimer.current);
    captionTimer.current = window.setTimeout(() => {
      if (id === captionSeq.current) setCaption(null);
    }, ms);
  }, []);

  /** Chime, then the Thai voice. The words stay on screen for a minute afterwards so anyone who missed them can read them. */
  const announce = useCallback(
    async ({ settings, volume, sound, caption: showCaption }: AnnounceOptions): Promise<SpeakResult | null> => {
      const mine = ++sequence.current;
      // A new announcement replaces the old one rather than talking over it.
      stopSpeaking();
      let captionId: number | null = null;
      if (showCaption) {
        captionId = ++captionSeq.current;
        setCaption({ key: captionId, text: captionFor(settings.text) });
        hideCaptionAfter(captionId, sound ? 90_000 : 60_000);
      }
      if (!sound) {
        setSpeaking(false);
        return null;
      }
      setSpeaking(true);
      // Wakes an audio engine the browser suspended (e.g. after a reload); works once the page has had a click.
      await unlockAudio();
      if (mine !== sequence.current) return null;
      const seconds = playChime(settings.chime);
      if (seconds > 0) await sleep(seconds * 1000 + 250);
      if (mine !== sequence.current) return null;
      const outcome = await speakThai(speakableThai(announcementText(settings.text)), {
        voiceUri: settings.voiceUri,
        rate: settings.rate,
        volume: Math.max(0.2, volume),
      });
      if (mine === sequence.current) {
        setSpeaking(false);
        if (outcome.status !== "stopped") setResult(outcome);
        if (captionId !== null) hideCaptionAfter(captionId, 60_000);
      }
      return outcome;
    },
    [hideCaptionAfter],
  );

  /** Stops the voice (and chime sequencing). `keepCaption` leaves the words on screen, e.g. when muting. */
  const silence = useCallback((options: { keepCaption?: boolean } = {}) => {
    sequence.current += 1;
    stopSpeaking();
    setSpeaking(false);
    if (!options.keepCaption) {
      captionSeq.current += 1;
      setCaption(null);
    }
  }, []);

  return { supported, voicesLoaded, voices: thaiVoices(voices), caption, speaking, result, announce, silence };
}
