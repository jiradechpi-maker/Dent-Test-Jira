"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ANNOUNCEMENT_LABELS,
  ANNOUNCEMENT_ORDER,
  DEFAULT_MOMENTS,
  captionFor,
  combineScripts,
  languageOrder,
  spokenParts,
  type AnnouncementContext,
  type AnnouncementId,
  type MomentId,
  type VoiceLanguage,
} from "@/lib/exam-timer/announcements";
import { playSound, type ExamSound } from "@/lib/exam-timer/sounds";
import { loadVoices, onVoicesChanged, speak, speechSupported, stopSpeaking, voicesFor, type SpeakStatus } from "@/lib/exam-timer/speech";
import type { Bi } from "@/lib/i18n/locale";

export interface VoiceSettings {
  /** Speak announcements (chimes and captions still follow their own switches). */
  enabled: boolean;
  language: VoiceLanguage;
  rate: number;
  thVoice: string;
  enVoice: string;
  /** Show the announcement as a bilingual caption on the projector. */
  captions: boolean;
  /** Which non-checkpoint moments are announced (checkpoints follow the warning minutes). */
  moments: Record<MomentId, boolean>;
  /** Staff-edited wording; missing entries use the standard script. */
  scripts: Partial<Record<AnnouncementId, Bi>>;
}

export const DEFAULT_VOICE: VoiceSettings = {
  enabled: true,
  language: "th-en",
  rate: 0.92,
  thVoice: "",
  enVoice: "",
  captions: true,
  moments: DEFAULT_MOMENTS,
  scripts: {},
};

const LANGUAGES: readonly VoiceLanguage[] = ["th", "en", "th-en", "en-th"];

export function normalizeVoice(value: unknown): VoiceSettings {
  const v = (typeof value === "object" && value !== null ? value : {}) as Partial<VoiceSettings> & {
    announceStart?: boolean;
    announceEnd?: boolean;
  };
  const scripts: Partial<Record<AnnouncementId, Bi>> = {};
  for (const id of ANNOUNCEMENT_ORDER) {
    const s = v.scripts?.[id];
    if (s && typeof s.th === "string" && typeof s.en === "string") scripts[id] = { th: s.th, en: s.en };
  }
  const moments = { ...DEFAULT_MOMENTS };
  for (const key of Object.keys(DEFAULT_MOMENTS) as MomentId[]) {
    if (typeof v.moments?.[key] === "boolean") moments[key] = v.moments[key];
  }
  // Settings saved before moments existed.
  if (typeof v.announceStart === "boolean") moments.start = v.announceStart;
  if (typeof v.announceEnd === "boolean") moments.end = v.announceEnd;
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : DEFAULT_VOICE.enabled,
    language: LANGUAGES.includes(v.language as VoiceLanguage) ? (v.language as VoiceLanguage) : DEFAULT_VOICE.language,
    rate: typeof v.rate === "number" && v.rate >= 0.5 && v.rate <= 1.5 ? v.rate : DEFAULT_VOICE.rate,
    thVoice: typeof v.thVoice === "string" ? v.thVoice : "",
    enVoice: typeof v.enVoice === "string" ? v.enVoice : "",
    captions: typeof v.captions === "boolean" ? v.captions : DEFAULT_VOICE.captions,
    moments,
    scripts,
  };
}

export type CaptionTone = "start" | "warning" | "end" | "custom";

export interface Caption {
  key: number;
  text: Bi;
  tone: CaptionTone;
}

export type AnnouncementRequest = { ids: AnnouncementId[] } | { custom: Bi };

export interface AnnounceOptions {
  voice: VoiceSettings;
  /** Master sound switch (the M key). Off = no chime and no speech. */
  sound: boolean;
  volume: number;
  context: AnnouncementContext;
  /** Play the attention chime first. */
  chime: boolean;
}

export type LogStatus = SpeakStatus | "chime" | "muted";

export interface LogEntry {
  key: number;
  at: number;
  label: Bi;
  status: LogStatus;
}

function toneOf(ids: AnnouncementId[]): CaptionTone {
  if (ids.includes("end")) return "end";
  if (ids.includes("start")) return "start";
  return "warning";
}

function chimeFor(tone: CaptionTone, speaking: boolean): ExamSound {
  if (tone === "start") return "start";
  if (tone === "end") return speaking ? "end-chime" : "end";
  return speaking ? "attention" : "warning";
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function useAnnouncer() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const sequence = useRef(0);
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!speechSupported()) return;
    setSupported(true);
    let alive = true;
    void loadVoices(5000).then((list) => alive && setVoices(list));
    const off = onVoicesChanged(() => setVoices(window.speechSynthesis.getVoices()));
    return () => {
      alive = false;
      off();
      stopSpeaking();
    };
  }, []);

  const hideCaptionLater = useCallback((ms: number) => {
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
    const mine = sequence.current;
    clearTimer.current = window.setTimeout(() => {
      if (mine === sequence.current) setCaption(null);
    }, ms);
  }, []);

  const announce = useCallback(
    async (request: AnnouncementRequest, options: AnnounceOptions): Promise<LogStatus> => {
      const mine = ++sequence.current;
      stopSpeaking();
      const isPreset = "ids" in request;
      const script = isPreset ? combineScripts(request.ids, options.voice.scripts) : request.custom;
      const tone: CaptionTone = isPreset ? toneOf(request.ids) : "custom";
      const label: Bi = isPreset
        ? {
            th: request.ids.map((id) => ANNOUNCEMENT_LABELS[id].th).join(" + "),
            en: request.ids.map((id) => ANNOUNCEMENT_LABELS[id].en).join(" + "),
          }
        : { th: "ประกาศเอง", en: "Custom" };
      const willSpeak = options.sound && options.voice.enabled;

      // Captions stay until the next announcement (at least a minute) so latecomers and anyone who
      // cannot hear still get the message; "time is up" stays for five.
      if (options.voice.captions) {
        setCaption({ key: mine, text: captionFor(script, options.context), tone });
        hideCaptionLater(tone === "end" ? 300_000 : 120_000);
      }

      if (options.sound && options.chime) {
        const seconds = playSound(chimeFor(tone, willSpeak));
        if (seconds > 0 && willSpeak) await sleep(seconds * 1000 + 300);
      }
      if (mine !== sequence.current) return "ok";

      let status: LogStatus = !options.sound ? "muted" : "chime";
      if (willSpeak) {
        setSpeaking(true);
        status = await speak(spokenParts(script, options.context, options.voice.language), {
          voices,
          voiceUris: { th: options.voice.thVoice, en: options.voice.enVoice },
          rate: options.voice.rate,
          volume: Math.max(0.2, options.volume),
        });
        if (mine === sequence.current) setSpeaking(false);
        setBlocked(status === "blocked");
      }
      if (options.voice.captions && mine === sequence.current) hideCaptionLater(tone === "end" ? 300_000 : 60_000);
      setLog((entries) => [{ key: mine, at: options.context.now, label, status }, ...entries].slice(0, 50));
      return status;
    },
    [voices, hideCaptionLater],
  );

  const silence = useCallback(() => {
    sequence.current += 1;
    stopSpeaking();
    setSpeaking(false);
    setCaption(null);
  }, []);

  const thVoices = voicesFor("th", voices);
  const enVoices = voicesFor("en", voices);

  /** Languages the chosen order needs but this computer has no voice for. */
  const missingLanguages = (language: VoiceLanguage) =>
    supported && voices.length ? languageOrder(language).filter((lang) => (lang === "th" ? thVoices : enVoices).length === 0) : [];

  return {
    supported,
    voices,
    thVoices,
    enVoices,
    caption,
    speaking,
    blocked,
    clearBlocked: () => setBlocked(false),
    log,
    announce,
    silence,
    missingLanguages,
  };
}

