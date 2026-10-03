"use client";

import { forwardRef } from "react";
import { DoorClosed, DoorOpen, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFullThaiDate, todayInBangkok } from "@/lib/thai";
import {
  extensionMs,
  formatClock,
  formatCountdown,
  formatDurationThai,
  phaseAt,
  progressAt,
  remainingMs,
  roomNotices,
  urgencyAt,
  type ExamSession,
  type RoomRules,
  type Urgency,
} from "@/lib/exam-timer/timing";

export type DisplayTheme = "dark" | "light";

const URGENCY_TEXT: Record<DisplayTheme, Record<Urgency, string>> = {
  dark: {
    calm: "text-white",
    notice: "text-amber-300",
    warning: "text-orange-400",
    critical: "text-rose-400",
    ended: "text-rose-400",
  },
  light: {
    calm: "text-neutral-900",
    notice: "text-amber-600",
    warning: "text-orange-600",
    critical: "text-rose-600",
    ended: "text-rose-600",
  },
};

const URGENCY_BAR: Record<Urgency, string> = {
  calm: "bg-brand-500",
  notice: "bg-amber-400",
  warning: "bg-orange-500",
  critical: "bg-rose-500",
  ended: "bg-rose-500",
};

export interface TimerDisplayProps {
  session: ExamSession | null;
  now: number;
  title: string;
  room: string;
  theme: DisplayTheme;
  fullscreen: boolean;
  rules: RoomRules;
  children?: React.ReactNode;
}

/** The projector-facing screen. Sizes itself to its container with container-query units. */
export const TimerDisplay = forwardRef<HTMLDivElement, TimerDisplayProps>(function TimerDisplay(
  { session, now, title, room, theme, fullscreen, rules, children },
  ref,
) {
  const dark = theme === "dark";
  const phase = session ? phaseAt(session, now) : null;
  const urgency: Urgency = session ? urgencyAt(session, now) : "calm";
  const remaining = session ? remainingMs(session, now) : 0;
  const progress = session ? progressAt(session, now) : 0;
  const justEnded = session !== null && phase === "ended" && now - session.endAt < 12_000;
  const extension = session ? extensionMs(session) : 0;
  const plannedEnd = session ? session.endAt - extension : 0;
  const notices = session ? roomNotices(session, now, rules) : [];
  const dateText = now > 0 ? formatFullThaiDate(todayInBangkok(new Date(now)), false) : "";

  const label =
    phase === "waiting"
      ? { th: "จะเริ่มสอบในอีก", en: "Exam begins in" }
      : phase === "running"
        ? { th: "เหลือเวลาสอบ", en: "Time remaining" }
        : phase === "ended"
          ? { th: "หมดเวลาสอบ", en: "Time is up" }
          : { th: "พร้อมจับเวลา", en: "Ready" };

  return (
    <div
      ref={ref}
      role="timer"
      aria-live="off"
      aria-label={`${label.th} ${session ? formatCountdown(remaining) : ""}`}
      className={cn(
        "@container relative flex min-h-0 flex-col overflow-hidden select-none",
        fullscreen ? "h-dvh w-screen rounded-none" : "aspect-video w-full rounded-[var(--radius-card)]",
        dark ? "bg-[radial-gradient(120%_120%_at_50%_0%,#2a0f4d_0%,#150a26_55%,#0c0616_100%)] text-white" : "bg-white text-neutral-900 ring-1 ring-border",
        fullscreen && "cursor-none [&:hover]:cursor-default",
      )}
    >
      {justEnded ? (
        <div aria-hidden className={cn("pointer-events-none absolute inset-0 animate-pulse-soft", dark ? "bg-rose-600/25" : "bg-rose-500/15")} />
      ) : null}
      {/* Header: exam title + live clock */}
      <div className="flex items-start justify-between gap-[3cqw] px-[4cqw] pt-[3cqw]">
        <div className="min-w-0">
          <p className={cn("truncate text-[3.4cqw] leading-tight font-semibold", dark ? "text-white" : "text-neutral-900")}>
            {title || "การสอบ"}
          </p>
          <p className={cn("mt-[0.4cqw] truncate text-[2.2cqw]", dark ? "text-white/60" : "text-neutral-500")}>
            {[room, dateText].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("text-[1.6cqw] tracking-wide uppercase", dark ? "text-white/50" : "text-neutral-400")}>เวลาปัจจุบัน · Now</p>
          <p className="font-[family-name:var(--font-latin)] text-[4cqw] leading-none font-semibold tabular">{now > 0 ? formatClock(now, true) : "--:--:--"}</p>
        </div>
      </div>

      {/* Main countdown */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[4cqw]">
        <p className={cn("text-[2.6cqw] font-medium", dark ? "text-white/70" : "text-neutral-500")}>
          {label.th} <span className="font-[family-name:var(--font-latin)] opacity-70">· {label.en}</span>
        </p>
        {phase === "ended" ? (
          <div className="mt-[1cqw] text-center">
            <p className={cn("text-[11cqw] leading-[1.05] font-bold", URGENCY_TEXT[theme].ended)}>หมดเวลา</p>
            <p className={cn("mt-[1cqw] text-[3.2cqw] font-medium", dark ? "text-white/85" : "text-neutral-700")}>
              กรุณาวางปากกา <span className="font-[family-name:var(--font-latin)]">· Please stop writing</span>
            </p>
          </div>
        ) : (
          <p
            className={cn(
              "font-[family-name:var(--font-latin)] leading-none font-semibold tracking-[-0.03em] tabular transition-colors duration-500",
              remaining >= 3_600_000 ? "text-[15cqw]" : "text-[19cqw]",
              session ? URGENCY_TEXT[theme][urgency] : dark ? "text-white/30" : "text-neutral-300",
              urgency === "critical" && "animate-pulse-soft",
            )}
          >
            {session ? formatCountdown(remaining) : "--:--"}
          </p>
        )}
      </div>

      {/* Exam-room rules, worded for right now */}
      {notices.length ? (
        <div className="flex flex-wrap items-center justify-center gap-[1.2cqw] px-[4cqw] pb-[1.6cqw]">
          {notices.map((notice) => {
            const Icon = notice.state === "open" ? DoorOpen : notice.state === "closed" ? DoorClosed : Info;
            return (
              <span
                key={notice.key}
                className={cn(
                  "flex items-center gap-[0.8cqw] rounded-full px-[1.8cqw] py-[0.6cqw] text-[1.9cqw] font-medium",
                  notice.state === "open" && (dark ? "bg-emerald-400/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"),
                  notice.state === "closed" && (dark ? "bg-rose-400/15 text-rose-200" : "bg-rose-50 text-rose-700"),
                  notice.state === "info" && (dark ? "bg-white/10 text-white/75" : "bg-neutral-100 text-neutral-600"),
                )}
              >
                <Icon className="size-[2cqw]" aria-hidden />
                {notice.text}
              </span>
            );
          })}
        </div>
      ) : null}

      {/* Footer: the exam's official time window + its length */}
      <div className="px-[4cqw] pb-[3cqw]">
        <div className={cn("flex items-end justify-between gap-[2cqw]", dark ? "text-white/70" : "text-neutral-600")}>
          <div className="min-w-0">
            <p className={cn("text-[1.6cqw] tracking-wide", dark ? "text-white/50" : "text-neutral-400")}>เวลาสอบ · Exam time</p>
            <p className="text-[3cqw] leading-tight">
              <b className={cn("font-[family-name:var(--font-latin)] font-semibold tabular", dark ? "text-white" : "text-neutral-900")}>
                {session ? `${formatClock(session.startAt)} – ${formatClock(plannedEnd)}` : "--:-- – --:--"}
              </b>
              <span className="ml-[0.8cqw] text-[2cqw]">น.</span>
              {extension > 0 && session ? (
                <span className={cn("ml-[1.4cqw] text-[2cqw] font-medium", dark ? "text-amber-300" : "text-amber-600")}>
                  ขยาย +{formatDurationThai(extension)} → {formatClock(session.endAt)} น.
                </span>
              ) : null}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("text-[1.6cqw] tracking-wide", dark ? "text-white/50" : "text-neutral-400")}>ระยะเวลา · Duration</p>
            <p className={cn("text-[3cqw] leading-tight font-semibold", dark ? "text-white" : "text-neutral-900")}>
              {session ? `รวม ${formatDurationThai(plannedEnd - session.startAt)}` : "—"}
            </p>
          </div>
        </div>
        <div className={cn("mt-[1.2cqw] h-[0.9cqw] min-h-1 w-full overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-neutral-100")}>
          <div
            className={cn("h-full rounded-full transition-[width] duration-700 ease-linear", URGENCY_BAR[urgency])}
            style={{ width: `${phase === "waiting" ? 0 : progress * 100}%` }}
          />
        </div>
      </div>

      {children}
    </div>
  );
});
