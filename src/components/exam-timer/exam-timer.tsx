"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BellRing,
  CalendarClock,
  Clock3,
  Maximize,
  Minimize,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Square,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { todayInBangkok } from "@/lib/thai";
import { useScheduleBundle } from "@/components/schedule/use-schedule";
import { useT } from "@/components/i18n/locale-provider";
import type { Bi } from "@/lib/i18n/locale";
import {
  ANNOUNCEMENT_LABELS,
  DEFAULT_WARNINGS,
  WARNING_MINUTES,
  announcementForMinutes,
  crossedMoments,
  isMinuteId,
  type AnnouncementContext,
  type AnnouncementId,
} from "@/lib/exam-timer/announcements";
import {
  createSession,
  createSessionFromDuration,
  crossedThresholds,
  didEnd,
  didStart,
  formatClock,
  formatDuration,
  phaseAt,
  todayAt,
  type ExamSession,
  type RoomRules,
  type SessionError,
} from "@/lib/exam-timer/timing";
import { isAudioReady, playSound, setVolume, unlockAudio, type ExamSound } from "@/lib/exam-timer/sounds";
import { TimerDisplay, type DisplayTheme } from "./timer-display";
import { DEFAULT_VOICE, normalizeVoice, useAnnouncer, type AnnouncementRequest, type VoiceSettings } from "./use-announcer";
import { VoicePanel } from "./voice-panel";
import { useServerClock } from "./use-server-clock";

const STORAGE_KEY = "dentops.examTimer.v3";
const LEGACY_STORAGE_KEYS = ["dentops.examTimer.v2", "dentops.examTimer.v1"] as const;
const DURATION_CHIPS = [60, 90, 120, 150, 180] as const;
const LATE_ENTRY_OPTIONS = [0, 15, 30, 45] as const;
const EARLY_LEAVE_OPTIONS = [0, 30, 45, 60] as const;
const LAST_LEAVE_OPTIONS = [0, 10, 15] as const;

interface TimerSettings {
  title: string;
  room: string;
  startMode: "now" | "scheduled";
  startTime: string;
  endTime: string;
  warnings: number[];
  sound: boolean;
  volume: number;
  theme: DisplayTheme;
  lateEntryMinutes: number;
  earlyLeaveMinutes: number;
  lastLeaveMinutes: number;
  voice: VoiceSettings;
}

const DEFAULT_SETTINGS: TimerSettings = {
  title: "",
  room: "",
  startMode: "scheduled",
  startTime: "",
  endTime: "",
  warnings: DEFAULT_WARNINGS,
  sound: true,
  volume: 0.85,
  theme: "dark",
  // KMITL faculty exam rules commonly use 30 / 60; "no leaving in the final 15" follows IB and UK/HK halls.
  lateEntryMinutes: 30,
  earlyLeaveMinutes: 60,
  lastLeaveMinutes: 15,
  voice: DEFAULT_VOICE,
};

interface StoredState {
  settings: TimerSettings;
  session: ExamSession | null;
}

const ERROR_TEXT: Record<SessionError, Bi> = {
  "invalid-end": { th: "กรุณาเลือกเวลาเลิกสอบ", en: "Choose the finish time" },
  "end-in-past": { th: "เวลาเลิกสอบต้องอยู่หลังเวลาปัจจุบัน", en: "The finish time must be later than now" },
  "invalid-start": { th: "กรุณาเลือกเวลาเริ่มสอบ", en: "Choose the start time" },
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

function readStored(): StoredState | null {
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    const legacyKey = current === null ? LEGACY_STORAGE_KEYS.find((key) => window.localStorage.getItem(key) !== null) : undefined;
    const raw = current ?? (legacyKey ? window.localStorage.getItem(legacyKey) : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const settings: TimerSettings = { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}), voice: normalizeVoice(parsed.settings?.voice) };
    const valid = new Set<number>(WARNING_MINUTES);
    settings.warnings = Array.isArray(settings.warnings) ? settings.warnings.filter((m) => valid.has(m)) : DEFAULT_WARNINGS;
    if (legacyKey) {
      // v1 defaulted to "start now", which put the button press time on screen instead of the exam's real start.
      if (legacyKey.endsWith("v1")) settings.startMode = "scheduled";
      // The old default (30/15/5) predates the 1-hour checkpoint.
      if ([...settings.warnings].sort().join() === "15,30,5") settings.warnings = DEFAULT_WARNINGS;
      // Old untouched room-rule defaults (45 / none) move to the sourced defaults.
      if (settings.earlyLeaveMinutes === 45 && settings.lastLeaveMinutes === 0) {
        settings.earlyLeaveMinutes = DEFAULT_SETTINGS.earlyLeaveMinutes;
        settings.lastLeaveMinutes = DEFAULT_SETTINGS.lastLeaveMinutes;
      }
    }
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

function hhmm(ms: number): string {
  return formatClock(ms);
}

/** Round start times around now (from `before` steps ago), for quick-pick chips — a start in the past means "already running". */
function startTimesAround(now: number, stepMinutes: number, before: number, after: number): string[] {
  const step = stepMinutes * 60_000;
  const base = Math.floor(now / step) * step;
  const out: string[] = [];
  for (let i = -before; i <= after; i += 1) {
    const candidate = base + i * step;
    if (new Date(candidate).getDate() === new Date(now).getDate()) out.push(hhmm(candidate));
  }
  return out;
}

/** The quarter hour nearest to now — a sensible first guess for the scheduled start. */
function nearestQuarter(now: number): string {
  const step = 15 * 60_000;
  return hhmm(Math.round(now / step) * step);
}

/** Upcoming round times (every `stepMinutes`) after `now`, for quick-pick chips. */
function upcomingTimes(now: number, stepMinutes: number, count: number, minLeadMinutes = 0): string[] {
  const step = stepMinutes * 60_000;
  const first = Math.ceil((now + minLeadMinutes * 60_000 + 1) / step) * step;
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const candidate = first + i * step;
    // Stay within today.
    if (new Date(candidate).getDate() !== new Date(now).getDate()) break;
    out.push(hhmm(candidate));
  }
  return out;
}

type WakeLockSentinelLike = { release: () => Promise<void> };

type SetupTab = "time" | "voice" | "display";

export function ExamTimer() {
  const t = useT();
  const locale = t.locale;
  const clock = useServerClock();
  const announcer = useAnnouncer();
  const announceRef = useRef(announcer.announce);
  announceRef.current = announcer.announce;
  const tRef = useRef(t);
  tRef.current = t;
  const [tab, setTab] = useState<SetupTab>("time");
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

  const displayRef = useRef<HTMLDivElement>(null);
  const prevNowRef = useRef<number>(0);
  const sessionRef = useRef<ExamSession | null>(null);
  const settingsRef = useRef<TimerSettings>(DEFAULT_SETTINGS);
  sessionRef.current = session;
  settingsRef.current = settings;

  // ── Restore from storage once on mount ───────────────────────────────────
  useEffect(() => {
    const stored = readStored();
    const current = Date.now();
    if (stored) {
      setSettings(stored.settings.startTime ? stored.settings : { ...stored.settings, startTime: nearestQuarter(current) });
      // Keep a finished session on screen for 15 minutes after it ended, then drop it.
      if (stored.session && current - stored.session.endAt < 15 * 60_000) setSession(stored.session);
    }
    else setSettings((s) => ({ ...s, startTime: nearestQuarter(current) }));
    prevNowRef.current = current;
    setNow(current);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStored({ settings, session });
  }, [hydrated, settings, session]);

  useEffect(() => {
    setVolume(settings.volume);
  }, [settings.volume, audioReady]);

  const play = useCallback((kind: ExamSound) => {
    if (!settingsRef.current.sound) return;
    if (playSound(kind) === 0) setAudioReady(isAudioReady());
  }, []);

  const contextFor = useCallback(
    (active: ExamSession | null, addedMinutes?: number): AnnouncementContext => {
      const s = settingsRef.current;
      const current = getNow();
      return {
        startAt: active?.startAt ?? current,
        endAt: active?.endAt ?? current + 3 * 3_600_000,
        now: current,
        title: s.title,
        room: s.room,
        addedMinutes,
      };
    },
    [getNow],
  );

  /** Chime + speech + caption for a request, following the current settings. */
  const fire = useCallback(
    (request: AnnouncementRequest, active: ExamSession | null, addedMinutes?: number) => {
      const s = settingsRef.current;
      void announceRef.current(request, { voice: s.voice, sound: s.sound, volume: s.volume, context: contextFor(active, addedMinutes), chime: true });
      if (s.sound && !isAudioReady()) setAudioReady(false);
    },
    [contextFor],
  );

  /** Moments reached on this tick: one toast for the operator, one combined announcement for the room. */
  const notify = useCallback(
    (ids: AnnouncementId[], active: ExamSession) => {
      const s = settingsRef.current;
      const tr = tRef.current;
      const spoken = ids.filter((id) => isMinuteId(id) || s.voice.moments[id]);
      if (spoken.length) fire({ ids: spoken }, active);
      else if (ids.includes("end")) play("end");
      else if (ids.includes("start")) play("start");
      const end = hhmm(active.endAt);
      for (const id of ids) {
        if (id === "start") toast.success(tr("เริ่มสอบแล้ว", "Exam started"), { description: tr(`เลิกสอบเวลา ${end} น.`, `Finishes at ${end}`) });
        else if (id === "end") toast.error(tr("หมดเวลาสอบ", "Time is up"), { description: tr("กรุณาวางปากกา", "Pens down") });
        else if (isMinuteId(id)) {
          const minutes = Number(id.slice(1));
          toast.warning(minutes === 60 ? tr("เหลือเวลาอีก 1 ชั่วโมง", "1 hour remaining") : tr(`เหลือเวลาอีก ${minutes} นาที`, `${minutes} minutes remaining`));
        } else if (spoken.includes(id)) {
          toast.info(tr(ANNOUNCEMENT_LABELS[id]));
        }
      }
    },
    [fire, play],
  );

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
        const ids: AnnouncementId[] = [];
        ids.push(...crossedMoments(active, s, prev, current).filter((id) => s.voice.moments[id]));
        if (didStart(active, prev, current)) ids.push("start");
        const crossed = crossedThresholds(active, prev, current, s.warnings);
        if (crossed.length > 0) {
          // A throttled tab can cross two checkpoints at once; announce only the latest.
          const id = announcementForMinutes(Math.min(...crossed));
          if (id) ids.push(id);
        }
        if (didEnd(active, prev, current)) ids.push("end");
        if (ids.length) notify(ids, active);
      }
      prevNowRef.current = current;
      setNow(current);
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [hydrated, getNow, notify]);

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

  const enterFullscreen = useCallback(async () => {
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
  }, []);

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

  const ensureAudio = useCallback(async () => {
    const ok = await unlockAudio();
    setVolume(settingsRef.current.volume);
    setAudioReady(ok);
    return ok;
  }, []);

  const begin = (newSession: ExamSession) => {
    prevNowRef.current = getNow();
    setSession(newSession);
    setError(null);
    const current = getNow();
    if (phaseAt(newSession, current) === "running") {
      // "You may now begin" only makes sense at the actual start, not when reopening a running exam.
      if (current - newSession.startAt < 90_000) notify(["start"], newSession);
      else toast.success(t("จับเวลาต่อจากเวลาจริงแล้ว", "Timer joined the running exam"), { description: t(`เลิกสอบเวลา ${hhmm(newSession.endAt)} น.`, `Finishes at ${hhmm(newSession.endAt)}`) });
    } else {
      const at = hhmm(newSession.startAt);
      toast.info(t(`ตั้งเวลาแล้ว — จะเริ่มสอบอัตโนมัติเวลา ${at} น.`, `Scheduled — the exam starts automatically at ${at}`));
    }
  };

  /** During a running exam the room hears it too — ask first. */
  const confirmLive = () =>
    !sessionRef.current ||
    phaseAt(sessionRef.current, getNow()) !== "running" ||
    window.confirm(t("การสอบกำลังดำเนินอยู่ ประกาศนี้จะดังในห้องสอบทันที ต้องการประกาศหรือไม่?", "An exam is running — the whole room will hear this now. Announce it?"));

  const previewAnnouncement = async (id: AnnouncementId) => {
    if (!confirmLive()) return;
    await ensureAudio();
    announcer.clearBlocked();
    fire({ ids: [id] }, sessionRef.current ?? preview, id === "extend" ? 5 : undefined);
  };

  const customAnnouncement = async (text: Bi) => {
    if (!confirmLive()) return;
    await ensureAudio();
    announcer.clearBlocked();
    fire({ custom: { th: text.th.trim(), en: text.en.trim() } }, sessionRef.current);
  };

  const start = async () => {
    await ensureAudio();
    const result = createSession(getNow(), {
      endTime: settings.endTime,
      startTime: settings.startMode === "scheduled" ? settings.startTime : null,
    });
    if (!result.ok) {
      setError(t(ERROR_TEXT[result.error]));
      return;
    }
    begin(result.session);
  };

  const startDuration = async (minutes: number) => {
    await ensureAudio();
    const current = getNow();
    if (settings.startMode === "scheduled") {
      const startAt = todayAt(current, settings.startTime);
      if (startAt === null) {
        setError(t(ERROR_TEXT["invalid-start"]));
        return;
      }
      update("endTime", hhmm(startAt + minutes * 60_000));
      return;
    }
    begin(createSessionFromDuration(current, minutes));
    update("endTime", hhmm(current + minutes * 60_000));
  };

  const stop = () => {
    setSession(null);
    announcer.silence();
    toast(t("หยุดจับเวลาแล้ว", "Timer stopped"));
  };

  const extend = (minutes: number) => {
    const current = sessionRef.current;
    if (!current) return;
    const next = { ...current, endAt: Math.max(current.endAt, getNow()) + minutes * 60_000 };
    sessionRef.current = next;
    setSession(next);
    toast.success(t(`ขยายเวลาสอบ +${minutes} นาที`, `Extended by ${minutes} minutes`));
    if (settingsRef.current.voice.moments.extend && phaseAt(next, getNow()) === "running") fire({ ids: ["extend"] }, next, minutes);
  };

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

  // ── Derived UI data ──────────────────────────────────────────────────────
  const endChips = useMemo(() => (now ? upcomingTimes(now, 30, 8, 10) : []), [now]);
  const startChips = useMemo(() => (now ? startTimesAround(now, 15, 2, 4) : []), [now]);
  const rules: RoomRules = {
    lateEntryMinutes: settings.lateEntryMinutes,
    earlyLeaveMinutes: settings.earlyLeaveMinutes,
    lastLeaveMinutes: settings.lastLeaveMinutes,
  };

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
    setSettings((s) => ({
      ...s,
      title: entry.title,
      room: entry.rooms.join(" · "),
      startMode: "scheduled",
      startTime: entry.start!,
      endTime: entry.end!,
    }));
    setError(null);
  };

  const preview = useMemo(() => {
    if (!now || !settings.endTime) return null;
    const result = createSession(now, {
      endTime: settings.endTime,
      startTime: settings.startMode === "scheduled" ? settings.startTime : null,
    });
    return result.ok ? result.session : null;
  }, [now, settings.endTime, settings.startMode, settings.startTime]);

  const running = session !== null && phase !== "ended";

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
            caption={announcer.caption}
          >
            {hydrated && fullscreen ? controlBar : null}
            {session && settings.sound && (!audioReady || announcer.blocked) && phase !== "ended" ? (
              <button
                type="button"
                onClick={() => {
                  announcer.clearBlocked();
                  void ensureAudio();
                }}
                className="absolute bottom-[9cqw] left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-lg"
              >
                <BellRing className="size-4" aria-hidden /> {t("แตะเพื่อเปิดเสียงแจ้งเตือน", "Tap to enable sound")}
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
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Kbd>F</Kbd> {t("เต็มจอ", "full screen")} <Kbd>M</Kbd> {t("ปิดเสียง", "mute")}
            </span>
            {clock.status === "synced" ? (
              <Badge tone="success">
                <Wifi aria-hidden /> {t("เวลาตรงกับเซิร์ฟเวอร์", "Synced with server time")}
                {clock.offset !== 0 ? t(` (ปรับ ${(clock.offset / 1000).toFixed(1)} วิ)`, ` (adjusted ${(clock.offset / 1000).toFixed(1)} s)`) : ""}
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

      {/* ── Setup ── */}
      <Card className="h-fit">
        <CardHeader>
          <div>
            <CardTitle>{t("ตั้งเวลาสอบ", "Exam setup")}</CardTitle>
            <CardDescription>
              {t("ใส่เวลาสอบตามตาราง เช่น 09:00–12:00 — จอแสดงเวลาสอบจริงและระยะเวลารวม", "Enter the scheduled time, e.g. 09:00–12:00 — the screen shows the official window and its length")}
            </CardDescription>
          </div>
          {running ? <Badge tone="success">{t("กำลังจับเวลา", "Running")}</Badge> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Segmented<SetupTab>
            ariaLabel={t("หมวดการตั้งค่า", "Settings section")}
            value={tab}
            onChange={setTab}
            className="w-full"
            options={[
              { value: "time", label: t("เวลาสอบ", "Time") },
              { value: "voice", label: t("ประกาศเสียง", "Announcements") },
              { value: "display", label: t("เสียงและจอ", "Sound & screen") },
            ]}
          />
          {tab === "time" ? (
          <>
          {todaysExams.length ? (
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5 text-brand-600" aria-hidden /> {t("สอบวันนี้ (จากตารางคุมสอบ)", "Today's exams (from the invigilation sheet)")}
              </Label>
              <ul className="flex flex-col gap-1">
                {todaysExams.map((entry) => {
                  const active = settings.title === entry.title && settings.startTime === entry.start && settings.endTime === entry.end;
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => pickExam(entry)}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("ชื่อการสอบ / รายวิชา", "Exam / course")} htmlFor="timer-title" className="col-span-2">
              <Input
                id="timer-title"
                value={settings.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={t("เช่น Fixed Prosthodontics — Midterm", "e.g. Fixed Prosthodontics — Midterm")}
                maxLength={120}
              />
            </Field>
            <Field label={t("ห้องสอบ", "Room")} htmlFor="timer-room" className="col-span-2">
              <Input
                id="timer-room"
                value={settings.room}
                onChange={(e) => update("room", e.target.value)}
                placeholder={t("เช่น DT01 · ตึก 55", "e.g. DT01 · Building 55")}
                maxLength={80}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("เริ่มสอบ", "Start")}</Label>
            <Segmented
              ariaLabel={t("เวลาเริ่มสอบ", "Start time")}
              value={settings.startMode}
              onChange={(v) => update("startMode", v)}
              options={[
                { value: "scheduled", label: t("ตามเวลาสอบจริง", "Scheduled time") },
                { value: "now", label: t("เริ่มทันที", "Start now") },
              ]}
            />
            {settings.startMode === "scheduled" ? (
              <div className="flex flex-col gap-2">
                <Input
                  type="time"
                  aria-label={t("เวลาเริ่มสอบ", "Start time")}
                  value={settings.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  className="h-10 text-base tabular"
                />
                <div className="flex flex-wrap gap-1.5">
                  {startChips.map((time) => (
                    <Chip key={time} active={settings.startTime === time} onClick={() => update("startTime", time)}>
                      {time}
                    </Chip>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "ใส่เวลาเริ่มตามตารางสอบ — ถ้ายังไม่ถึงเวลา ระบบนับถอยหลังแล้วเริ่มให้อัตโนมัติ ถ้าเลยมาแล้วจะนับต่อจากเวลาจริง (เช่น สอบ 09:00–12:00 เปิดจอ 09:05 ก็ยังแสดง “รวม 3 ชั่วโมง”)",
                    "Enter the scheduled start — before it, the screen counts down and starts by itself; after it, the timer joins the running exam (09:00–12:00 opened at 09:05 still shows “3 hours”).",
                  )}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="timer-end">
              {t("เลิกสอบเวลา", "Finish time")} <span className="text-danger">*</span>
            </Label>
            <Input
              id="timer-end"
              type="time"
              value={settings.endTime}
              onChange={(e) => update("endTime", e.target.value)}
              aria-invalid={error !== null}
              className="h-10 text-base tabular"
            />
            <div className="flex flex-wrap gap-1.5" aria-label={t("เลือกเวลาเลิกสอบอย่างรวดเร็ว", "Quick finish times")}>
              {endChips.map((time) => (
                <Chip key={time} active={settings.endTime === time} onClick={() => update("endTime", time)}>
                  {time}
                </Chip>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {settings.startMode === "now"
                  ? t("หรือเริ่มทันที สอบนาน:", "Or start now for:")
                  : t("หรือสอบนาน (นับจากเวลาเริ่ม):", "Or a length from the start:")}
              </span>
              {DURATION_CHIPS.map((m) => (
                <Chip key={m} onClick={() => void startDuration(m)}>
                  {formatDuration(m * 60_000, locale)}
                </Chip>
              ))}
            </div>
            {preview ? (
              <p className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand-50 px-2.5 py-2 text-xs text-brand-900">
                <Clock3 className="size-3.5 shrink-0" aria-hidden />
                {t(
                  `เวลาสอบ ${hhmm(preview.startAt)}–${hhmm(preview.endAt)} น. · รวม ${formatDuration(preview.endAt - preview.startAt, "th")}`,
                  `Exam ${hhmm(preview.startAt)}–${hhmm(preview.endAt)} · ${formatDuration(preview.endAt - preview.startAt, "en")}`,
                )}
                {preview.startAt < now ? t(` · เหลือ ${formatDuration(preview.endAt - now, "th")}`, ` · ${formatDuration(preview.endAt - now, "en")} left`) : ""}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>

          <Button size="lg" onClick={() => void start()} className="h-11 text-sm">
            {session ? <RotateCcw aria-hidden /> : <Play aria-hidden />}
            {session ? t("ตั้งเวลาใหม่", "Reset timer") : t("เริ่มจับเวลา", "Start timer")}
          </Button>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <Label>{t("กติกาห้องสอบ (แสดงบนจอ)", "Exam-room rules (shown on screen)")}</Label>
              <p className="text-[11px] text-muted-foreground">
                {t("ตามระเบียบการสอบของคณะ/สถาบัน — ปรับได้ตามแต่ละวิชา", "Follow the faculty's exam regulations — adjust per course")}
              </p>
            </div>
            <RuleChips
              label={t("เข้าห้องสอบได้ไม่เกิน (หลังเริ่มสอบ)", "Late entry allowed for (after the start)")}
              options={LATE_ENTRY_OPTIONS}
              value={settings.lateEntryMinutes}
              onChange={(v) => update("lateEntryMinutes", v)}
            />
            <RuleChips
              label={t("ออกจากห้องสอบได้หลังเริ่มสอบ", "Earliest leaving (after the start)")}
              options={EARLY_LEAVE_OPTIONS}
              value={settings.earlyLeaveMinutes}
              onChange={(v) => update("earlyLeaveMinutes", v)}
            />
            <RuleChips
              label={t("งดออกจากห้องช่วงท้าย", "No leaving in the final")}
              options={LAST_LEAVE_OPTIONS}
              value={settings.lastLeaveMinutes}
              onChange={(v) => update("lastLeaveMinutes", v)}
            />
          </div>
          </>
          ) : null}

          {tab === "voice" ? (
            <VoicePanel
              voice={settings.voice}
              onVoiceChange={(voice) => update("voice", voice)}
              warnings={settings.warnings}
              onWarningsChange={(warnings) => update("warnings", warnings)}
              supported={announcer.supported}
              thVoices={announcer.thVoices}
              enVoices={announcer.enVoices}
              speaking={announcer.speaking}
              missingLanguages={announcer.missingLanguages(settings.voice.language)}
              log={announcer.log}
              onPreview={(id) => void previewAnnouncement(id)}
              onCustom={(text) => void customAnnouncement(text)}
              onStop={announcer.silence}
            />
          ) : null}

          {tab === "display" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="timer-sound">{t("เสียงทั้งหมด (กริ่งและเสียงพูด)", "All sound (chimes and voice)")}</Label>
              <Switch id="timer-sound" checked={settings.sound} onCheckedChange={(v) => update("sound", v)} />
            </div>
            <div className="flex items-center gap-3">
              <VolumeX className="size-4 text-neutral-400" aria-hidden />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(e) => update("volume", Number(e.target.value))}
                aria-label={t("ระดับเสียง", "Volume")}
                className="h-1.5 flex-1 cursor-pointer accent-brand-600"
                disabled={!settings.sound}
              />
              <Volume2 className="size-4 text-neutral-400" aria-hidden />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="w-full text-[11px] text-muted-foreground">{t("ทดสอบเสียงกริ่ง (ก่อนเริ่มสอบ)", "Test the chimes (before the exam)")}</span>
              {(
                [
                  ["start", t("เริ่มสอบ", "Start")],
                  ["warning", t("เตือน", "Warning")],
                  ["end", t("หมดเวลา", "Time up")],
                ] as const
              ).map(([kind, label]) => (
                <Button
                  key={kind}
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (await ensureAudio()) playSound(kind);
                    else toast.error(t("เบราว์เซอร์นี้ไม่รองรับเสียง", "This browser cannot play sound"));
                  }}
                >
                  <BellRing aria-hidden /> {label}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>{t("ธีมหน้าจอ", "Screen theme")}</Label>
              <Segmented
                ariaLabel={t("ธีมหน้าจอ", "Screen theme")}
                value={settings.theme}
                onChange={(v) => update("theme", v)}
                options={[
                  {
                    value: "dark",
                    label: (
                      <span className="flex items-center gap-1">
                        <Moon className="size-3.5" aria-hidden /> {t("มืด", "Dark")}
                      </span>
                    ),
                  },
                  {
                    value: "light",
                    label: (
                      <span className="flex items-center gap-1">
                        <Sun className="size-3.5" aria-hidden /> {t("สว่าง", "Light")}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Chip({
  active = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "h-7 cursor-pointer rounded-[var(--radius-chip)] border px-2.5 font-[family-name:var(--font-latin)] text-xs font-medium tabular transition-colors outline-none focus-visible:shadow-[var(--shadow-focus)]",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-border bg-card text-neutral-700 hover:border-brand-300 hover:bg-brand-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function RuleChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly number[];
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-full text-[11px] text-muted-foreground">{label}</span>
      {options.map((m) => (
        <Chip key={m} active={value === m} aria-pressed={value === m} onClick={() => onChange(m)}>
          {m === 0 ? t("ไม่กำหนด", "Off") : t(`${m} นาที`, `${m} min`)}
        </Chip>
      ))}
    </div>
  );
}
