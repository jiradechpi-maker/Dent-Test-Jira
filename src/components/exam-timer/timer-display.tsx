"use client";

import { forwardRef } from "react";
import { DoorClosed, DoorOpen, Info, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayInBangkok } from "@/lib/thai";
import { displayYear, formatDay, monthName, weekdayName } from "@/lib/i18n/dates";
import type { Caption } from "./use-announcer";
import {
  extensionMs,
  formatClock,
  formatCountdown,
  formatDuration,
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
  caption?: Caption | null;
  children?: React.ReactNode;
}

/** "เสาร์ 3 ต.ค. 2569 · Sat 3 Oct 2026" — both calendars, since the room is international. */
function bilingualDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return `${weekdayName(weekday, "th")} ${d} ${monthName(m!, "th", "short")} ${displayYear(y!, "th")} · ${formatDay(iso, "en", "medium")}`;
}

/** The projector-facing screen. Sizes itself to its container with container-query units. */
export const TimerDisplay = forwardRef<HTMLDivElement, TimerDisplayProps>(function TimerDisplay(
  { session, now, title, room, theme, fullscreen, rules, caption, children },
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
  const dateText = now > 0 ? bilingualDate(todayInBangkok(new Date(now))) : "";

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
      aria-label={`${label.th} · ${label.en} ${session ? formatCountdown(remaining) : ""}`}
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
            {title || "การสอบ · Examination"}
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

      {/* Main countdown — sized against this box's own height too, so it never runs into the header or rules */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[4cqw] pt-[0.8cqw]" style={{ containerType: "size" }}>
        <p className={cn("text-[min(2.8cqw,10cqh)] font-medium", dark ? "text-white/70" : "text-neutral-500")}>
          <span lang="th">{label.th}</span>{" "}
          <span lang="en" className="font-[family-name:var(--font-latin)] opacity-70">
            · {label.en}
          </span>
        </p>
        {phase === "ended" ? (
          <div className="mt-[1cqw] text-center">
            <p lang="th" className={cn("text-[min(12cqw,48cqh)] leading-[1.05] font-bold", URGENCY_TEXT[theme].ended)}>
              หมดเวลา
            </p>
            <p className={cn("mt-[1cqw] text-[min(3.4cqw,13cqh)] font-medium", dark ? "text-white/85" : "text-neutral-700")}>
              <span lang="th">กรุณาวางปากกา</span>{" "}
              <span lang="en" className="font-[family-name:var(--font-latin)]">
                · Please stop writing
              </span>
            </p>
          </div>
        ) : (
          <p
            className={cn(
              "font-[family-name:var(--font-latin)] font-semibold tracking-[-0.03em] tabular transition-colors duration-500",
              remaining >= 3_600_000 ? "text-[min(16cqw,72cqh)]" : "text-[min(21cqw,72cqh)]",
              // after the size: tailwind-merge drops an earlier leading-* when a font-size follows
              "leading-none",
              session ? URGENCY_TEXT[theme][urgency] : dark ? "text-white/30" : "text-neutral-300",
              urgency === "critical" && "animate-pulse-soft",
            )}
          >
            {session ? formatCountdown(remaining) : "--:--"}
          </p>
        )}
      </div>

      {/* Announcement caption — in the layout (not over the clock), so the countdown shrinks instead of being hidden */}
      {caption ? (
        <div
          key={caption.key}
          role="status"
          aria-live="polite"
          className={cn(
            "mx-[4cqw] mb-[1.6cqw] flex shrink-0 items-start gap-[1.4cqw] rounded-[1.4cqw] px-[2cqw] py-[1.2cqw] shadow-xl animate-fade-in",
            caption.tone === "end"
              ? "bg-rose-600 text-white"
              : caption.tone === "warning"
                ? dark
                  ? "bg-amber-300 text-amber-950"
                  : "bg-amber-100 text-amber-950 ring-1 ring-amber-300"
                : dark
                  ? "bg-white text-neutral-900"
                  : "bg-brand-700 text-white",
          )}
        >
          <Megaphone className="mt-[0.3cqw] size-[2.6cqw] shrink-0" aria-hidden />
          <div className="min-w-0">
            {caption.text.th ? (
              <p lang="th" className="font-[family-name:var(--font-sans)] text-[2.3cqw] leading-snug font-semibold">
                {caption.text.th}
              </p>
            ) : null}
            {caption.text.en ? (
              <p lang="en" className="mt-[0.3cqw] font-[family-name:var(--font-latin)] text-[1.8cqw] leading-snug font-medium opacity-85">
                {caption.text.en}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Exam-room rules, worded for right now (the caption takes their place while it is shown) */}
      {notices.length && !caption ? (
        <div className="flex flex-wrap items-center justify-center gap-[1.2cqw] px-[4cqw] pb-[1.6cqw]">
          {notices.map((notice) => {
            const Icon = notice.state === "open" ? DoorOpen : notice.state === "closed" ? DoorClosed : Info;
            return (
              <span
                key={notice.key}
                className={cn(
                  "flex items-center gap-[0.9cqw] rounded-[1.6cqw] px-[1.6cqw] py-[0.6cqw] text-[1.8cqw] font-medium",
                  notice.state === "open" && (dark ? "bg-emerald-400/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"),
                  notice.state === "closed" && (dark ? "bg-rose-400/15 text-rose-200" : "bg-rose-50 text-rose-700"),
                  notice.state === "info" && (dark ? "bg-white/10 text-white/75" : "bg-neutral-100 text-neutral-600"),
                )}
              >
                <Icon className="size-[2.2cqw] shrink-0" aria-hidden />
                <span className="flex flex-col leading-tight">
                  <span lang="th">{notice.text.th}</span>
                  <span lang="en" className="font-[family-name:var(--font-latin)] text-[1.5cqw] font-normal opacity-80">
                    {notice.text.en}
                  </span>
                </span>
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
              {extension > 0 && session ? (
                <span className={cn("ml-[1.4cqw] text-[2cqw] font-medium", dark ? "text-amber-300" : "text-amber-600")}>
                  ขยายเวลา · Extended +{formatDuration(extension, "en")} → {formatClock(session.endAt)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("text-[1.6cqw] tracking-wide", dark ? "text-white/50" : "text-neutral-400")}>ระยะเวลา · Duration</p>
            <p className={cn("text-[3cqw] leading-tight font-semibold", dark ? "text-white" : "text-neutral-900")}>
              {session ? <span lang="th">{`รวม ${formatDuration(plannedEnd - session.startAt, "th")}`}</span> : "—"}
              {session ? (
                <span className={cn("ml-[1cqw] font-[family-name:var(--font-latin)] text-[2cqw] font-medium", dark ? "text-white/60" : "text-neutral-500")}>
                  {formatDuration(plannedEnd - session.startAt, "en")}
                </span>
              ) : null}
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
