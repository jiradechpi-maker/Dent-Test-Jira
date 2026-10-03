"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BellRing,
  Calculator,
  CalendarClock,
  Clock3,
  Maximize,
  Minimize,
  Moon,
  Play,
  Plus,
  Printer,
  RotateCcw,
  ScrollText,
  Square,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { todayInBangkok } from "@/lib/thai";
import { useScheduleBundle } from "@/components/schedule/use-schedule";
import { useT } from "@/components/i18n/locale-provider";
import type { Bi } from "@/lib/i18n/locale";
import { ANNOUNCE_AT_MINUTES } from "@/lib/exam-timer/announcements";
import {
  createSession,
  crossedThresholds,
  didEnd,
  didStart,
  formatClock,
  formatDuration,
  phaseAt,
  type ExamSession,
  type SessionError,
} from "@/lib/exam-timer/timing";
import { playSound, setVolume, unlockAudio, type ExamSound } from "@/lib/exam-timer/sounds";
import {
  EARLY_LEAVE_CHOICES,
  LATE_ENTRY_CHOICES,
  REGULATION_RULES,
  describeRules,
  isRegulation,
  normalizeRules,
  type RoomRules,
} from "@/lib/exam-timer/room-rules";
import { DEFAULT_STUDENT_RULES, normalizeStudentRules, studentRuleCards, type StudentRulesSettings } from "@/lib/exam-timer/student-rules";
import { TimerDisplay, type DisplayTheme } from "./timer-display";
import { DEFAULT_ANNOUNCE, normalizeAnnounce, useAnnouncer, type AnnounceSettings } from "./use-announcer";
import { SoundSettings } from "./sound-settings";
import { ExamNoticePrint } from "./exam-notice-print";
import { useServerClock } from "./use-server-clock";

const STORAGE_KEY = "dentops.examTimer.v4";
const LEGACY_STORAGE_KEYS = ["dentops.examTimer.v3", "dentops.examTimer.v2", "dentops.examTimer.v1"] as const;

interface TimerSettings {
  title: string;
  room: string;
  startTime: string;
  endTime: string;
  sound: boolean;
  volume: number;
  theme: DisplayTheme;
  rules: RoomRules;
  studentRules: StudentRulesSettings;
  announce: AnnounceSettings;
}

const DEFAULT_SETTINGS: TimerSettings = {
  title: "",
  room: "",
  startTime: "",
  endTime: "",
  sound: true,
  volume: 0.85,
  theme: "dark",
  rules: REGULATION_RULES,
  studentRules: DEFAULT_STUDENT_RULES,
  announce: DEFAULT_ANNOUNCE,
};

interface StoredState {
  settings: TimerSettings;
  session: ExamSession | null;
  /** Bangkok date the start/finish times were entered for; times from another day are not reused. */
  savedOn?: string;
}

const MIN_VOLUME = 0.1;

const ERROR_TEXT: Record<SessionError, Bi> = {
  "invalid-end": { th: "กรุณาใส่เวลาเลิกสอบ", en: "Enter the finish time" },
  "end-in-past": { th: "เวลาเลิกสอบต้องอยู่หลังเวลาปัจจุบัน", en: "The finish time must be later than now" },
  "invalid-start": { th: "กรุณาใส่เวลาเริ่มสอบ หรือกด “เริ่มสอบเดี๋ยวนี้”", en: "Enter the start time, or press “Start now”" },
  "start-after-end": { th: "เวลาเริ่มสอบต้องอยู่ก่อนเวลาเลิกสอบ", en: "The start time must be before the finish time" },
};

function isValidSession(value: unknown): value is ExamSession {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.startAt === "number" &&
    typeof v.endAt === "number" &&
    typeof v.createdAt === "number" &&
    Number.isFinite(v.startAt) &&
    Number.isFinite(v.endAt) &&
    v.endAt > v.startAt
  );
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Settings saved by earlier versions: keep the exam details, start the sound options fresh. */
function legacyAnnounce(raw: Record<string, unknown>): AnnounceSettings {
  const voice = (raw.voice ?? {}) as { enabled?: unknown };
  const warnings = Array.isArray(raw.warnings) ? (raw.warnings as unknown[]) : null;
  // A room that had switched the 5-minute warning off keeps it off.
  const fiveMinutes = voice.enabled !== false && (warnings ? warnings.includes(5) : true);
  return normalizeAnnounce({ fiveMinutes });
}

function readStored(today: string): StoredState | null {
  try {
    const key = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].find((k) => window.localStorage.getItem(k) !== null);
    if (!key) return null;
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}") as { settings?: Record<string, unknown>; session?: unknown; savedOn?: unknown };
    const raw = parsed.settings ?? {};
    // Times typed for another day (or by an older version, which also kept a stale "start now" time) are dropped.
    const sameDay = key === STORAGE_KEY && parsed.savedOn === today;
    const settings: TimerSettings = {
      title: text(raw.title),
      room: text(raw.room),
      startTime: sameDay ? text(raw.startTime) : "",
      endTime: sameDay ? text(raw.endTime) : "",
      sound: typeof raw.sound === "boolean" ? raw.sound : true,
      volume: typeof raw.volume === "number" && raw.volume >= MIN_VOLUME && raw.volume <= 1 ? raw.volume : DEFAULT_SETTINGS.volume,
      theme: raw.theme === "light" ? "light" : "dark",
      // Rules saved by the versions with presets are not carried over: the choices changed, the regulation is the default.
      rules: normalizeRules(raw.rules),
      studentRules: normalizeStudentRules(raw.studentRules),
      announce: key === STORAGE_KEY ? normalizeAnnounce(raw.announce) : legacyAnnounce(raw),
    };
    return { settings, session: isValidSession(parsed.session) ? parsed.session : null };
  } catch {
    return null;
  }
}

function writeStored(state: StoredState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / storage disabled — the timer still works, it just won't survive a reload.
  }
}

const hhmm = (ms: number) => formatClock(ms);

/** The quarter hour nearest to now — a sensible first guess for the start time. */
function nearestQuarter(now: number): string {
  const step = 15 * 60_000;
  return hhmm(Math.round(now / step) * step);
}

type WakeLockSentinelLike = { release: () => Promise<void> };

export function ExamTimer() {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const clock = useServerClock();
  const announcer = useAnnouncer();
  const announceRef = useRef(announcer.announce);
  announceRef.current = announcer.announce;
  const offsetRef = useRef(0);
  offsetRef.current = clock.offset;
  const getNow = useCallback(() => Date.now() + offsetRef.current, []);

  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [now, setNow] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  /** The date printed on the A4 notice — today unless the office prints ahead for another day. Not saved. */
  const [noticeDate, setNoticeDate] = useState("");

  const displayRef = useRef<HTMLDivElement>(null);
  const prevNowRef = useRef<number>(0);
  /** Moments already signalled ("m5@<session>@<end>") — a clock stepping backwards must not repeat them. */
  const firedRef = useRef(new Set<string>());
  const sessionRef = useRef<ExamSession | null>(null);
  const settingsRef = useRef<TimerSettings>(DEFAULT_SETTINGS);
  sessionRef.current = session;
  settingsRef.current = settings;

  // ── Restore from storage once on mount ───────────────────────────────────
  useEffect(() => {
    const current = Date.now();
    const stored = readStored(todayInBangkok(new Date(current)));
    if (stored) {
      setSettings(stored.settings.startTime ? stored.settings : { ...stored.settings, startTime: nearestQuarter(current) });
      // Keep a finished session on screen for 15 minutes after it ended, then drop it.
      if (stored.session && current - stored.session.endAt < 15 * 60_000) setSession(stored.session);
    } else {
      setSettings((s) => ({ ...s, startTime: nearestQuarter(current) }));
    }
    prevNowRef.current = current;
    setNow(current);
    setNoticeDate(todayInBangkok(new Date(current)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStored({ settings, session, savedOn: todayInBangkok() });
  }, [hydrated, settings, session]);

  // Muting silences everything at once, including a chime or bell already ringing.
  useEffect(() => {
    setVolume(settings.sound ? settings.volume : 0);
  }, [settings.sound, settings.volume, audioReady]);

  const { dismiss } = announcer;

  const play = useCallback((kind: ExamSound) => {
    if (!settingsRef.current.sound) return;
    // Wake the audio engine first: after a reload the browser may have suspended it.
    void unlockAudio().then((ok) => {
      if (!ok || playSound(kind) === 0) setAudioReady(false);
    });
  }, []);

  /** True the first time a moment is reached for this session and finish time. */
  const firstTime = useCallback((key: string) => {
    if (firedRef.current.has(key)) return false;
    firedRef.current.add(key);
    return true;
  }, []);

  // ── Tick: derive everything from the clock; fire events on transitions ──
  useEffect(() => {
    if (!hydrated) return;
    const tick = () => {
      const current = getNow();
      const prev = prevNowRef.current;
      const active = sessionRef.current;
      // After sleep or a long freeze, don't replay moments that are already stale.
      if (active && current > prev && current - prev < 90_000) {
        const s = settingsRef.current;
        const tr = tRef.current;
        if (didStart(active, prev, current) && firstTime(`start@${active.createdAt}@${active.startAt}`)) {
          play("start");
          toast.success(tr("เริ่มสอบแล้ว", "Exam started"), { description: tr(`เลิกสอบเวลา ${hhmm(active.endAt)} น.`, `Finishes at ${hhmm(active.endAt)}`) });
        }
        // An extension moves the finish time, so the warning can play again for the new finish — on purpose.
        if (crossedThresholds(active, prev, current, [ANNOUNCE_AT_MINUTES]).length > 0 && firstTime(`m5@${active.createdAt}@${active.endAt}`)) {
          toast.warning(tr("เหลือเวลาสอบอีก 5 นาที", "5 minutes remaining"));
          if (s.announce.fiveMinutes) {
            void announceRef.current({ settings: s.announce, sound: s.sound, showForMs: 60_000 }).then((ok) => {
              if (!ok) setAudioReady(false);
            });
          }
        }
        if (didEnd(active, prev, current) && firstTime(`end@${active.createdAt}@${active.endAt}`)) {
          play("end");
          toast.error(tr("หมดเวลาสอบ", "Time is up"), { description: tr("กรุณาวางปากกา", "Pens down") });
        }
      }
      prevNowRef.current = current;
      setNow(current);
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [hydrated, getNow, play, firstTime]);

  // When the clock offset changes, re-baseline so the jump itself never fires an event.
  useEffect(() => {
    prevNowRef.current = getNow();
  }, [clock.offset, getNow]);

  // ── Fullscreen (real API, with a CSS fallback for iPhone Safari) ─────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === displayRef.current && displayRef.current !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const fullscreen = isFullscreen || pseudoFullscreen;

  const ensureAudio = useCallback(async () => {
    const ok = await unlockAudio();
    setVolume(settingsRef.current.sound ? settingsRef.current.volume : 0);
    setAudioReady(ok);
    return ok;
  }, []);

  // Any click or key on the page counts as permission to play sound, so a reloaded timer still rings.
  useEffect(() => {
    const unlock = () => void ensureAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureAudio]);

  const enterFullscreen = useCallback(async () => {
    void ensureAudio();
    const el = displayRef.current;
    if (!el) return;
    if (typeof el.requestFullscreen === "function" && document.fullscreenEnabled) {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
        return;
      } catch {
        // fall through to CSS fullscreen
      }
    }
    setPseudoFullscreen(true);
  }, [ensureAudio]);

  const exitFullscreen = useCallback(async () => {
    setPseudoFullscreen(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // already exited
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (fullscreen) void exitFullscreen();
    else void enterFullscreen();
  }, [fullscreen, enterFullscreen, exitFullscreen]);

  // Auto-hide on-screen controls in fullscreen after 2.5 s without mouse movement.
  useEffect(() => {
    if (!fullscreen) {
      setControlsVisible(true);
      return;
    }
    let timeout = window.setTimeout(() => setControlsVisible(false), 2500);
    const show = () => {
      setControlsVisible(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setControlsVisible(false), 2500);
    };
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
    };
  }, [fullscreen]);

  // ── Keep the projector screen awake while an exam is active ─────────────
  const phase = session && now ? phaseAt(session, now) : null;
  const keepAwake = phase === "waiting" || phase === "running";
  useEffect(() => {
    if (!keepAwake) return;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let released = false;
    const acquire = async () => {
      try {
        const lock = await nav.wakeLock?.request("screen");
        if (released) await lock?.release();
        else sentinel = lock ?? null;
      } catch {
        // Not allowed (battery saver, iframe…) — harmless.
      }
    };
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [keepAwake]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const update = <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setError(null);
  };

  /** `startTime: null` = the exam starts now (the "เริ่มสอบเดี๋ยวนี้" button). */
  const begin = async (startTime: string | null) => {
    void ensureAudio();
    if (startTime === "") {
      setError(t(ERROR_TEXT["invalid-start"]));
      return;
    }
    const current = getNow();
    const result = createSession(current, { endTime: settings.endTime, startTime });
    if (!result.ok) {
      setError(t(ERROR_TEXT[result.error]));
      return;
    }
    const next = result.session;
    // A new session replaces the old one completely, including a warning still on screen.
    if (sessionRef.current) dismiss();
    prevNowRef.current = current;
    sessionRef.current = next;
    setSession(next);
    setError(null);
    if (startTime === null) update("startTime", hhmm(next.startAt));
    if (phaseAt(next, current) === "running") {
      // The start chime only makes sense at the actual start, not when joining an exam already under way.
      if (current - next.startAt < 90_000) {
        play("start");
        toast.success(t("เริ่มจับเวลาแล้ว", "Timer started"), { description: t(`เลิกสอบเวลา ${hhmm(next.endAt)} น.`, `Finishes at ${hhmm(next.endAt)}`) });
      } else {
        toast.success(t("จับเวลาต่อจากเวลาจริงแล้ว", "Timer joined the running exam"), {
          description: t(`เลิกสอบเวลา ${hhmm(next.endAt)} น.`, `Finishes at ${hhmm(next.endAt)}`),
        });
      }
    } else {
      const at = hhmm(next.startAt);
      toast.info(t(`ตั้งเวลาแล้ว — จะเริ่มสอบอัตโนมัติเวลา ${at} น.`, `Scheduled — the exam starts automatically at ${at}`));
    }
  };

  const stop = () => {
    setSession(null);
    dismiss();
    toast(t("หยุดจับเวลาแล้ว", "Timer stopped"));
  };

  const extend = (minutes: number) => {
    const current = sessionRef.current;
    if (!current) return;
    const next = { ...current, endAt: Math.max(current.endAt, getNow()) + minutes * 60_000 };
    sessionRef.current = next;
    setSession(next);
    // "เหลือเวลาสอบอีก 5 นาที" is no longer true once time is added.
    dismiss();
    toast.success(t(`ขยายเวลาสอบ +${minutes} นาที`, `Extended by ${minutes} minutes`));
  };

  /** During a running exam the room hears a test too — ask first. */
  const confirmLive = () =>
    phase !== "running" ||
    window.confirm(t("การสอบกำลังดำเนินอยู่ เสียงทดลองจะดังในห้องสอบทันที ต้องการเล่นหรือไม่?", "An exam is running — the whole room will hear this now. Play it?"));

  /** The chime and the words on the screen for a few seconds, exactly as at 5 minutes left. */
  const testWarning = async () => {
    if (!confirmLive()) return;
    await ensureAudio();
    const ok = await announcer.announce({ settings: settings.announce, sound: settings.sound, showForMs: 10_000 });
    if (!ok) toast.error(t("เครื่องนี้เล่นเสียงไม่ได้ — ตรวจลำโพง หรือคลิกที่หน้านี้แล้วลองอีกครั้ง", "This browser cannot play sound — check the speakers, or click the page and try again"));
  };

  const setRules = (rules: Partial<RoomRules>) => update("rules", { ...settings.rules, ...rules });
  const setStudentRules = (studentRules: Partial<StudentRulesSettings>) => update("studentRules", { ...settings.studentRules, ...studentRules });

  const toggleSound = () => update("sound", !settings.sound);

  // Keyboard shortcuts: F = fullscreen, M = mute, Esc handled natively by the browser.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setSettings((s) => ({ ...s, sound: !s.sound }));
      } else if (event.key === "Escape" && pseudoFullscreen) {
        setPseudoFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen, pseudoFullscreen]);

  // Today's exams from the invigilation sheet — one tap fills the title, room and official times.
  const { invigilation } = useScheduleBundle();
  const today = now ? todayInBangkok(new Date(now)) : "";
  const todaysExams = useMemo(() => {
    if (!invigilation?.ok || !today) return [];
    return invigilation.data.entries
      .filter((entry) => entry.date === today && entry.start && entry.end && !entry.postponed)
      .sort((a, b) => a.start!.localeCompare(b.start!));
  }, [invigilation, today]);
  const pickExam = (entry: (typeof todaysExams)[number]) => {
    setSettings((s) => ({ ...s, title: entry.title, room: entry.rooms.join(" · "), startTime: entry.start!, endTime: entry.end! }));
    setError(null);
  };

  const preview = useMemo(() => {
    if (!now || !settings.endTime) return null;
    const result = createSession(now, { endTime: settings.endTime, startTime: settings.startTime || null });
    return result.ok ? result.session : null;
  }, [now, settings.endTime, settings.startTime]);

  const running = session !== null && phase !== "ended";
  const rules = settings.rules;
  const board = settings.studentRules.show ? studentRuleCards(rules, settings.studentRules) : null;

  const controlBar = (
    <div
      className={cn(
        "absolute top-[12cqw] right-[4cqw] z-10 flex items-center gap-1 rounded-full bg-black/55 p-1 text-white shadow-lg backdrop-blur transition-opacity duration-300",
        controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {session ? (
        <button
          type="button"
          onClick={() => extend(5)}
          className="flex h-9 cursor-pointer items-center gap-1 rounded-full px-3 text-sm font-medium hover:bg-white/15"
          aria-label={t("ขยายเวลา 5 นาที", "Extend by 5 minutes")}
        >
          <Plus className="size-4" aria-hidden /> {t("5 นาที", "5 min")}
        </button>
      ) : null}
      <button
        type="button"
        onClick={toggleSound}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-white/15"
        aria-label={settings.sound ? t("ปิดเสียง", "Mute") : t("เปิดเสียง", "Unmute")}
        aria-pressed={!settings.sound}
      >
        {settings.sound ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={toggleFullscreen}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-white/15"
        aria-label={fullscreen ? t("ออกจากเต็มจอ", "Exit full screen") : t("แสดงเต็มจอ", "Full screen")}
      >
        {fullscreen ? <Minimize className="size-4" aria-hidden /> : <Maximize className="size-4" aria-hidden />}
      </button>
    </div>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      {hydrated ? (
        <ExamNoticePrint
          title={settings.title}
          room={settings.room}
          date={noticeDate}
          startTime={settings.startTime}
          endTime={settings.endTime}
          rules={rules}
          options={settings.studentRules}
        />
      ) : null}

      {/* ── Display ── */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className={cn(pseudoFullscreen && "fixed inset-0 z-[100]")}>
          <TimerDisplay
            ref={displayRef}
            session={session}
            now={now || 0}
            title={settings.title}
            room={settings.room}
            theme={settings.theme}
            fullscreen={fullscreen}
            rules={rules}
            board={board}
            caption={announcer.caption}
          >
            {hydrated && fullscreen ? controlBar : null}
            {session && settings.sound && !audioReady && phase !== "ended" ? (
              <button
                type="button"
                onClick={() => void ensureAudio()}
                className="absolute bottom-[9cqw] left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-lg"
              >
                <BellRing className="size-4" aria-hidden /> {t("แตะเพื่อเปิดเสียง", "Tap to enable sound")}
              </button>
            ) : null}
          </TimerDisplay>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="lg" onClick={() => void enterFullscreen()} aria-label={t("แสดงเต็มจอสำหรับโปรเจกเตอร์", "Full screen for the projector")}>
            <Maximize aria-hidden /> {t("แสดงเต็มจอ", "Full screen")}
          </Button>
          {session ? (
            <>
              <Button variant="secondary" size="lg" onClick={() => extend(5)}>
                <Plus aria-hidden /> {t("ขยาย 5 นาที", "+5 min")}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => extend(10)}>
                <Plus aria-hidden /> {t("ขยาย 10 นาที", "+10 min")}
              </Button>
              <Button variant="ghost" size="lg" onClick={stop} className="text-danger hover:bg-danger-bg">
                <Square aria-hidden /> {t("หยุด", "Stop")}
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => update("theme", settings.theme === "dark" ? "light" : "dark")}
            aria-label={t("สลับจอมืด/สว่าง", "Switch dark/light screen")}
          >
            {settings.theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
            {settings.theme === "dark" ? t("จอสว่าง", "Light screen") : t("จอมืด", "Dark screen")}
          </Button>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Kbd>F</Kbd> {t("เต็มจอ", "full screen")} <Kbd>M</Kbd> {t("ปิดเสียง", "mute")}
            </span>
            {clock.status === "synced" ? (
              <Badge tone="success">
                <Wifi aria-hidden /> {t("เวลาตรงกับเซิร์ฟเวอร์", "Synced with server time")}
              </Badge>
            ) : clock.status === "local" ? (
              <Badge tone="warning">
                <WifiOff aria-hidden /> {t("ใช้เวลาเครื่องนี้", "Using this computer's clock")}
              </Badge>
            ) : (
              <Badge>{t("กำลังซิงก์เวลา…", "Syncing time…")}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Setup: three short steps, then the sound card ── */}
      <div className="flex flex-col gap-5">
        <Card className="h-fit">
          <CardHeader>
            <div>
              <CardTitle>{t("ตั้งค่าการสอบ", "Exam setup")}</CardTitle>
              <CardDescription>{t("ทำตามขั้นตอน 1–3 แล้วกดเริ่มจับเวลา · ข้อ 4–5 ตั้งไว้ให้แล้ว ปรับได้", "Fill in steps 1–3, then start the timer · steps 4–5 are already set, change them if needed")}</CardDescription>
            </div>
            {running ? <Badge tone="success">{t("กำลังจับเวลา", "Running")}</Badge> : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Step number={1} title={t("การสอบ", "Exam")}>
              {todaysExams.length ? (
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5 text-brand-600" aria-hidden /> {t("สอบวันนี้ — กดเพื่อเติมให้", "Today's exams — tap to fill in")}
                  </span>
                  <ul className="flex flex-col gap-1">
                    {todaysExams.map((entry) => {
                      const active = settings.title === entry.title && settings.startTime === entry.start && settings.endTime === entry.end;
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => pickExam(entry)}
                            aria-pressed={active}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-2.5 py-1.5 text-left text-xs transition-colors",
                              active ? "border-brand-600 bg-brand-50" : "border-border hover:border-brand-300 hover:bg-brand-50/50",
                            )}
                          >
                            <span className="shrink-0 font-[family-name:var(--font-latin)] font-semibold tabular">
                              {entry.start}–{entry.end}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                            {entry.rooms.length ? <span className="shrink-0 text-muted-foreground">{entry.rooms.join(", ")}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              <Field label={t("ชื่อการสอบ / รายวิชา", "Exam / course")} htmlFor="timer-title">
                <Input
                  id="timer-title"
                  value={settings.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder={t("เช่น Fixed Prosthodontics — Midterm", "e.g. Fixed Prosthodontics — Midterm")}
                  maxLength={120}
                />
              </Field>
              <Field label={t("ห้องสอบ", "Room")} htmlFor="timer-room">
                <Input
                  id="timer-room"
                  value={settings.room}
                  onChange={(e) => update("room", e.target.value)}
                  placeholder={t("เช่น DT01 · ตึก 55", "e.g. DT01 · Building 55")}
                  maxLength={80}
                />
              </Field>
            </Step>

            <Step number={2} title={t("เวลาสอบ", "Time")}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="timer-start">{t("เริ่ม", "Start")}</Label>
                  <Input
                    id="timer-start"
                    type="time"
                    value={settings.startTime}
                    onChange={(e) => update("startTime", e.target.value)}
                    className="h-11 text-base tabular"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="timer-end">
                    {t("เลิก", "Finish")} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="timer-end"
                    type="time"
                    value={settings.endTime}
                    onChange={(e) => update("endTime", e.target.value)}
                    aria-invalid={error !== null}
                    className="h-11 text-base tabular"
                  />
                </div>
              </div>
              {preview ? (
                <p className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand-50 px-2.5 py-2 text-xs text-brand-900">
                  <Clock3 className="size-3.5 shrink-0" aria-hidden />
                  {t(
                    `เวลาสอบ ${hhmm(preview.startAt)}–${hhmm(preview.endAt)} น. · รวม ${formatDuration(preview.endAt - preview.startAt, "th")}`,
                    `Exam ${hhmm(preview.startAt)}–${hhmm(preview.endAt)} · ${formatDuration(preview.endAt - preview.startAt, "en")}`,
                  )}
                </p>
              ) : null}
            </Step>

            <Step number={3} title={t("กติกาเข้า–ออกห้องสอบ", "Entering & leaving")}>
              <ChoiceGroup
                label={t("เข้าห้องสอบสายได้ไม่เกิน", "Late entry allowed")}
                choices={LATE_ENTRY_CHOICES}
                value={rules.lateEntryMinutes}
                regulation={REGULATION_RULES.lateEntryMinutes}
                labelFor={(m) => (m === 0 ? t("ไม่ให้สาย", "None") : t(`${m} นาที`, `${m} min`))}
                onChange={(m) => setRules({ lateEntryMinutes: m })}
              />
              <ChoiceGroup
                label={t("ออกจากห้องสอบได้เมื่อสอบไปแล้ว", "May leave after")}
                choices={EARLY_LEAVE_CHOICES}
                value={rules.earlyLeaveMinutes}
                regulation={REGULATION_RULES.earlyLeaveMinutes}
                labelFor={(m) => (m === 60 ? t("1 ชั่วโมง", "1 hour") : t(`${m} นาที`, `${m} min`))}
                onChange={(m) => setRules({ earlyLeaveMinutes: m })}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(describeRules(rules))}
                {isRegulation(rules) ? (
                  <span className="block text-[11px]">{t("ตรงตามข้อบังคับสถาบัน ข้อ ๒", "Matches the Institute regulation (clause 2)")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => update("rules", REGULATION_RULES)}
                    className="mt-0.5 flex cursor-pointer items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
                  >
                    <RotateCcw className="size-3" aria-hidden /> {t("กลับไปใช้ตามข้อบังคับ (สาย 30 นาที · ออกหลัง 1 ชั่วโมง)", "Back to the regulation (30 min late · leave after 1 hour)")}
                  </button>
                )}
              </p>
            </Step>

            {error ? (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={() => void begin(settings.startTime)} className="h-12 text-sm">
                {session ? <RotateCcw aria-hidden /> : <Play aria-hidden />}
                {session ? t("ตั้งเวลาใหม่", "Reset timer") : t("เริ่มจับเวลา", "Start timer")}
              </Button>
              <Button variant="secondary" onClick={() => void begin(null)}>
                <Play aria-hidden /> {t("เริ่มสอบเดี๋ยวนี้ (ไม่รอเวลาเริ่ม)", "Start the exam now")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <StepNumber number={4} />
                {t("ข้อปฏิบัติสำหรับนักศึกษา", "Rules for students")}
              </CardTitle>
              <CardDescription>
                {t(
                  "ข้อบังคับให้แจ้งก่อนเริ่มสอบทุกครั้ง ทั้งทางวาจาและลายลักษณ์อักษร (บัตร · มือถือ · สิ่งของต้องห้าม · การแต่งกาย · ทุจริต)",
                  "The regulation asks invigilators to announce these before every exam, aloud and in writing (ID · phones · prohibited items · dress · misconduct)",
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SwitchRow
              id="rules-board"
              icon={ScrollText}
              label={t("แสดงบนจอก่อนเริ่มสอบ", "Show on screen before the start")}
              hint={t("ตอนนักศึกษาเข้าห้อง จอจะแสดงข้อปฏิบัติ 6 ข้อ พร้อมเวลานับถอยหลัง", "While students take their seats, the screen shows six rules and the countdown")}
              checked={settings.studentRules.show}
              onCheckedChange={(show) => setStudentRules({ show })}
            />
            <SwitchRow
              id="rules-calculator"
              icon={Calculator}
              label={t("วิชานี้อนุญาตให้ใช้เครื่องคิดเลข", "Calculators allowed in this exam")}
              checked={settings.studentRules.calculatorAllowed}
              onCheckedChange={(calculatorAllowed) => setStudentRules({ calculatorAllowed })}
            />
            <div className="flex items-end gap-2">
              <div className="flex w-40 shrink-0 flex-col gap-1">
                <Label htmlFor="notice-date" className="text-xs font-normal text-muted-foreground">
                  {t("วันที่สอบ (ในประกาศ)", "Exam date (on the notice)")}
                </Label>
                <Input id="notice-date" type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} className="h-9 text-sm tabular" />
              </div>
              <Button variant="secondary" onClick={() => window.print()} className="h-9 flex-1">
                <Printer aria-hidden /> {t("พิมพ์ประกาศ (A4)", "Print notice (A4)")}
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t(
                "ประกาศข้อปฏิบัติฉบับเต็ม 2 ภาษา ใส่ชื่อวิชา ห้อง และเวลาจากขั้นตอน 1–2 กับวันที่ด้านบน — พิมพ์ล่วงหน้าได้ ติดหน้าห้องสอบ หรืออ่านให้นักศึกษาฟังก่อนเริ่มสอบ (เลือก “บันทึกเป็น PDF” ได้)",
                "The full rules notice in Thai and English, with the exam, room and time from steps 1–2 and the date above — print it ahead, post it at the door or read it out (you can also “Save as PDF”)",
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepNumber number={5} />
              {t("เสียงกริ่งและการเตือน", "Chimes & warning")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SoundSettings
              announce={settings.announce}
              onAnnounceChange={(announce) => update("announce", announce)}
              volume={settings.volume}
              onVolumeChange={(volume) => update("volume", volume)}
              sound={settings.sound}
              onSoundChange={(sound) => update("sound", sound)}
              onTest={() => void testWarning()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepNumber({ number }: { number: number }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 font-[family-name:var(--font-latin)] text-[11px] font-semibold text-white">
      {number}
    </span>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <StepNumber number={number} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function ChoiceGroup({
  label,
  choices,
  value,
  regulation,
  labelFor,
  onChange,
}: {
  label: string;
  choices: readonly number[];
  value: number;
  /** The choice the institute regulation prescribes; marked under its button. */
  regulation: number;
  labelFor: (minutes: number) => string;
  onChange: (minutes: number) => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-700">{label}</span>
      <div role="group" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-[var(--radius-control)] bg-neutral-100 p-1">
        {choices.map((minutes) => {
          const selected = value === minutes;
          return (
            <button
              key={minutes}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(minutes)}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-[6px] px-1.5 py-1 text-sm font-medium transition-colors outline-none focus-visible:shadow-[var(--shadow-focus)]",
                selected ? "bg-card text-brand-800 shadow-[var(--shadow-sm)] ring-1 ring-brand-300" : "text-neutral-600 hover:bg-white/60 hover:text-neutral-900",
              )}
            >
              {labelFor(minutes)}
              {minutes === regulation ? (
                <span className={cn("text-[10px] leading-tight font-normal", selected ? "text-brand-600" : "text-neutral-400")}>{t("ตามข้อบังคับ", "Regulation")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  icon: Icon,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <Label htmlFor={id} className="flex flex-col gap-0.5 leading-snug">
        <span className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-brand-600" aria-hidden />
          {label}
        </span>
        {hint ? <span className="pl-[22px] text-[11px] font-normal text-muted-foreground">{hint}</span> : null}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
