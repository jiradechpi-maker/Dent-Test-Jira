"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BellRing,
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
import {
  createSession,
  createSessionFromDuration,
  crossedThresholds,
  didEnd,
  didStart,
  formatClock,
  formatDurationThai,
  phaseAt,
  todayAt,
  type ExamSession,
  type SessionError,
} from "@/lib/exam-timer/timing";
import { isAudioReady, playSound, setVolume, unlockAudio, type ExamSound } from "@/lib/exam-timer/sounds";
import { TimerDisplay, type DisplayTheme } from "./timer-display";
import { useServerClock } from "./use-server-clock";

const STORAGE_KEY = "dentops.examTimer.v1";
const WARNING_OPTIONS = [30, 15, 5] as const;
const DURATION_CHIPS = [60, 90, 120, 150, 180] as const;

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
}

const DEFAULT_SETTINGS: TimerSettings = {
  title: "",
  room: "",
  startMode: "now",
  startTime: "",
  endTime: "",
  warnings: [30, 15, 5],
  sound: true,
  volume: 0.85,
  theme: "dark",
};

interface StoredState {
  settings: TimerSettings;
  session: ExamSession | null;
}

const ERROR_TEXT: Record<SessionError, string> = {
  "invalid-end": "กรุณาเลือกเวลาเลิกสอบ",
  "end-in-past": "เวลาเลิกสอบต้องอยู่หลังเวลาปัจจุบัน",
  "invalid-start": "กรุณาเลือกเวลาเริ่มสอบ",
  "start-after-end": "เวลาเริ่มสอบต้องอยู่ก่อนเวลาเลิกสอบ",
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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) };
    if (!Array.isArray(settings.warnings)) settings.warnings = DEFAULT_SETTINGS.warnings;
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

export function ExamTimer() {
  const clock = useServerClock();
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
      setSettings(stored.settings);
      // Keep a finished session on screen for 15 minutes after it ended, then drop it.
      if (stored.session && current - stored.session.endAt < 15 * 60_000) setSession(stored.session);
    }
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

  // ── Tick: derive everything from the clock; fire events on transitions ──
  useEffect(() => {
    if (!hydrated) return;
    const tick = () => {
      const current = getNow();
      const prev = prevNowRef.current;
      const active = sessionRef.current;
      if (active && current > prev) {
        if (didStart(active, prev, current)) {
          play("start");
          toast.success("เริ่มสอบแล้ว", { description: `เลิกสอบเวลา ${hhmm(active.endAt)} น.` });
        }
        const crossed = crossedThresholds(active, prev, current, settingsRef.current.warnings);
        if (crossed.length > 0) {
          const minutes = Math.min(...crossed);
          play("warning");
          toast.warning(`เหลือเวลาอีก ${minutes} นาที`);
        }
        if (didEnd(active, prev, current)) {
          play("end");
          toast.error("หมดเวลาสอบ", { description: "กรุณาวางปากกา" });
        }
      }
      prevNowRef.current = current;
      setNow(current);
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [hydrated, getNow, play]);

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
      play("start");
      toast.success("เริ่มจับเวลาแล้ว", { description: `เลิกสอบเวลา ${hhmm(newSession.endAt)} น.` });
    } else {
      toast.info(`ตั้งเวลาแล้ว — จะเริ่มสอบอัตโนมัติเวลา ${hhmm(newSession.startAt)} น.`);
    }
  };

  const start = async () => {
    await ensureAudio();
    const result = createSession(getNow(), {
      endTime: settings.endTime,
      startTime: settings.startMode === "scheduled" ? settings.startTime : null,
    });
    if (!result.ok) {
      setError(ERROR_TEXT[result.error]);
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
        setError(ERROR_TEXT["invalid-start"]);
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
    toast("หยุดจับเวลาแล้ว");
  };

  const extend = (minutes: number) => {
    setSession((s) => {
      if (!s) return s;
      const base = Math.max(s.endAt, getNow());
      return { ...s, endAt: base + minutes * 60_000 };
    });
    toast.success(`ขยายเวลาสอบ +${minutes} นาที`);
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
  const startChips = useMemo(() => (now ? upcomingTimes(now, 15, 4, 0) : []), [now]);

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
          aria-label="ขยายเวลา 5 นาที"
        >
          <Plus className="size-4" aria-hidden /> 5 นาที
        </button>
      ) : null}
      <button
        type="button"
        onClick={toggleSound}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-white/15"
        aria-label={settings.sound ? "ปิดเสียง" : "เปิดเสียง"}
        aria-pressed={!settings.sound}
      >
        {settings.sound ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={toggleFullscreen}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-white/15"
        aria-label={fullscreen ? "ออกจากเต็มจอ" : "แสดงเต็มจอ"}
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
          >
            {hydrated && fullscreen ? controlBar : null}
            {session && settings.sound && !audioReady && phase !== "ended" ? (
              <button
                type="button"
                onClick={() => void ensureAudio()}
                className="absolute bottom-[9cqw] left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-lg"
              >
                <BellRing className="size-4" aria-hidden /> แตะเพื่อเปิดเสียงแจ้งเตือน
              </button>
            ) : null}
          </TimerDisplay>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="lg" onClick={() => void enterFullscreen()} aria-label="แสดงเต็มจอสำหรับโปรเจกเตอร์">
            <Maximize aria-hidden /> แสดงเต็มจอ
          </Button>
          {session ? (
            <>
              <Button variant="secondary" size="lg" onClick={() => extend(5)}>
                <Plus aria-hidden /> ขยาย 5 นาที
              </Button>
              <Button variant="secondary" size="lg" onClick={() => extend(10)}>
                <Plus aria-hidden /> ขยาย 10 นาที
              </Button>
              <Button variant="ghost" size="lg" onClick={stop} className="text-danger hover:bg-danger-bg">
                <Square aria-hidden /> หยุด
              </Button>
            </>
          ) : null}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Kbd>F</Kbd> เต็มจอ <Kbd>M</Kbd> ปิดเสียง
            </span>
            {clock.status === "synced" ? (
              <Badge tone="success">
                <Wifi aria-hidden /> เวลาตรงกับเซิร์ฟเวอร์{clock.offset !== 0 ? ` (ปรับ ${(clock.offset / 1000).toFixed(1)} วิ)` : ""}
              </Badge>
            ) : clock.status === "local" ? (
              <Badge tone="warning">
                <WifiOff aria-hidden /> ใช้เวลาเครื่องนี้
              </Badge>
            ) : (
              <Badge>กำลังซิงก์เวลา…</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Setup ── */}
      <Card className="h-fit">
        <CardHeader>
          <div>
            <CardTitle>ตั้งเวลาสอบ</CardTitle>
            <CardDescription>เลือกเวลาเลิกสอบ ระบบคำนวณเวลาที่เหลือจากเวลาปัจจุบันให้ทันที</CardDescription>
          </div>
          {running ? <Badge tone="success">กำลังจับเวลา</Badge> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ชื่อการสอบ / รายวิชา" htmlFor="timer-title" className="col-span-2">
              <Input
                id="timer-title"
                value={settings.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="เช่น Fixed Prosthodontics — Midterm"
                maxLength={120}
              />
            </Field>
            <Field label="ห้องสอบ" htmlFor="timer-room" className="col-span-2">
              <Input
                id="timer-room"
                value={settings.room}
                onChange={(e) => update("room", e.target.value)}
                placeholder="เช่น DT01 · ตึก 55"
                maxLength={80}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <Label>เริ่มสอบ</Label>
            <Segmented
              ariaLabel="เวลาเริ่มสอบ"
              value={settings.startMode}
              onChange={(v) => update("startMode", v)}
              options={[
                { value: "now", label: "เริ่มทันที" },
                { value: "scheduled", label: "ตั้งเวลาเริ่ม" },
              ]}
            />
            {settings.startMode === "scheduled" ? (
              <div className="flex flex-col gap-2">
                <Input
                  type="time"
                  aria-label="เวลาเริ่มสอบ"
                  value={settings.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  className="h-10 text-base tabular"
                />
                <div className="flex flex-wrap gap-1.5">
                  {startChips.map((t) => (
                    <Chip key={t} active={settings.startTime === t} onClick={() => update("startTime", t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  ระบบจะนับถอยหลังถึงเวลาเริ่ม แล้วเริ่มจับเวลาสอบให้อัตโนมัติ — ไม่ต้องกดตอนเริ่มสอบ
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="timer-end">
              เลิกสอบเวลา <span className="text-danger">*</span>
            </Label>
            <Input
              id="timer-end"
              type="time"
              value={settings.endTime}
              onChange={(e) => update("endTime", e.target.value)}
              aria-invalid={error !== null}
              className="h-10 text-base tabular"
            />
            <div className="flex flex-wrap gap-1.5" aria-label="เลือกเวลาเลิกสอบอย่างรวดเร็ว">
              {endChips.map((t) => (
                <Chip key={t} active={settings.endTime === t} onClick={() => update("endTime", t)}>
                  {t}
                </Chip>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {settings.startMode === "now" ? "หรือเริ่มทันที สอบนาน:" : "หรือสอบนาน (นับจากเวลาเริ่ม):"}
              </span>
              {DURATION_CHIPS.map((m) => (
                <Chip key={m} onClick={() => void startDuration(m)}>
                  {formatDurationThai(m * 60_000)}
                </Chip>
              ))}
            </div>
            {preview ? (
              <p className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand-50 px-2.5 py-2 text-xs text-brand-900">
                <Clock3 className="size-3.5 shrink-0" aria-hidden />
                {settings.startMode === "scheduled" && preview.startAt > now
                  ? `เริ่ม ${hhmm(preview.startAt)} → เลิก ${hhmm(preview.endAt)} · สอบ ${formatDurationThai(preview.endAt - preview.startAt)}`
                  : `เหลือเวลาสอบ ${formatDurationThai(preview.endAt - now)} (ถึง ${hhmm(preview.endAt)} น.)`}
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
            {session ? "ตั้งเวลาใหม่" : "เริ่มจับเวลา"}
          </Button>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="timer-sound">เสียงแจ้งเตือน</Label>
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
                aria-label="ระดับเสียง"
                className="h-1.5 flex-1 cursor-pointer accent-brand-600"
                disabled={!settings.sound}
              />
              <Volume2 className="size-4 text-neutral-400" aria-hidden />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="w-full text-[11px] text-muted-foreground">เตือนก่อนหมดเวลา</span>
              {WARNING_OPTIONS.map((m) => {
                const on = settings.warnings.includes(m);
                return (
                  <Chip
                    key={m}
                    active={on}
                    aria-pressed={on}
                    onClick={() => update("warnings", on ? settings.warnings.filter((w) => w !== m) : [...settings.warnings, m])}
                  >
                    {m} นาที
                  </Chip>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="w-full text-[11px] text-muted-foreground">ทดสอบเสียง (ทดสอบก่อนเริ่มสอบ)</span>
              {(
                [
                  ["start", "เริ่มสอบ"],
                  ["warning", "เตือน"],
                  ["end", "หมดเวลา"],
                ] as const
              ).map(([kind, label]) => (
                <Button
                  key={kind}
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (await ensureAudio()) playSound(kind);
                    else toast.error("เบราว์เซอร์นี้ไม่รองรับเสียง");
                  }}
                >
                  <BellRing aria-hidden /> {label}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>ธีมหน้าจอ</Label>
              <Segmented
                ariaLabel="ธีมหน้าจอ"
                value={settings.theme}
                onChange={(v) => update("theme", v)}
                options={[
                  {
                    value: "dark",
                    label: (
                      <span className="flex items-center gap-1">
                        <Moon className="size-3.5" aria-hidden /> มืด
                      </span>
                    ),
                  },
                  {
                    value: "light",
                    label: (
                      <span className="flex items-center gap-1">
                        <Sun className="size-3.5" aria-hidden /> สว่าง
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>
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
