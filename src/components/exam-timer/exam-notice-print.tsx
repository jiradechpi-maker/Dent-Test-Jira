"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDay } from "@/lib/i18n/dates";
import { describeRules, type RoomRules } from "@/lib/exam-timer/room-rules";
import { noticeSections, type StudentRulesSettings } from "@/lib/exam-timer/student-rules";
import { RULE_ICONS } from "./rule-icons";

export const NOTICE_PRINT_ROOT_ID = "notice-print-root";

export interface ExamNoticeProps {
  title: string;
  room: string;
  /** Bangkok date (YYYY-MM-DD) the notice is for. */
  date: string;
  /** "09:00" or "" */
  startTime: string;
  endTime: string;
  rules: RoomRules;
  options: StudentRulesSettings;
}

/**
 * The written notice the regulation asks for (ข้อ ๑๐: "ทั้งทางวาจาและลายลักษณ์อักษร"): one A4 page in Thai and
 * English, to post at the door or read out before the exam. Lives off-screen; `window.print()` prints only this.
 */
export function ExamNoticePrint(props: ExamNoticeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div id={NOTICE_PRINT_ROOT_ID} aria-hidden style={{ position: "fixed", left: -100_000, top: 0 }}>
      <ExamNotice {...props} />
    </div>,
    document.body,
  );
}

export function ExamNotice({ title, room, date, startTime, endTime, rules, options }: ExamNoticeProps) {
  const sections = noticeSections(rules, options);
  const summary = describeRules(rules);
  const time = startTime && endTime ? `${startTime}–${endTime}` : "";
  const facts: { th: string; en: string; value: string }[] = [
    { th: "รายวิชา", en: "Exam", value: title.trim() },
    { th: "ห้องสอบ", en: "Room", value: room.trim() },
    { th: "วันที่", en: "Date", value: date ? `${formatDay(date, "th", "long")} · ${formatDay(date, "en", "long")}` : "" },
    { th: "เวลา", en: "Time", value: time ? `${time} น.` : "" }, // i18n-exempt: the printed notice is bilingual by design
  ].filter((fact) => fact.value);

  return (
    <article lang="th" className="box-border flex h-[297mm] w-[210mm] flex-col bg-white px-[15mm] pt-[10mm] pb-[8mm] font-[family-name:var(--font-sans)] text-[#1f1530] [print-color-adjust:exact]">
      <header className="flex items-center gap-[4mm] border-b-[0.6mm] border-[#4F0080] pb-[3mm]">
        {/* eslint-disable-next-line @next/next/no-img-element -- printed as-is */}
        <img src="/brand/kmitl-emblem.jpeg" alt="" className="h-[15mm] w-[15mm] shrink-0 rounded-full" />
        <div className="min-w-0 leading-snug">
          <p className="text-[11pt] font-semibold">คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง</p>
          <p lang="en" className="font-[family-name:var(--font-latin)] text-[8.5pt] text-[#5b4b70]">
            Faculty of Dentistry, King Mongkut&apos;s Institute of Technology Ladkrabang
          </p>
        </div>
      </header>

      <div className="mt-[4mm] flex items-end justify-between gap-[6mm]">
        <div>
          <h1 className="text-[20pt] leading-none font-bold text-[#4F0080]">ข้อปฏิบัติในการสอบ</h1>
          <p lang="en" className="mt-[1.2mm] font-[family-name:var(--font-latin)] text-[11pt] font-semibold text-[#4F0080]/80">
            Examination Rules
          </p>
        </div>
        <p className="max-w-[80mm] text-right text-[8.5pt] leading-snug text-[#5b4b70]">
          {summary.th}
          <span lang="en" className="block font-[family-name:var(--font-latin)] text-[7.5pt]">
            {summary.en}
          </span>
        </p>
      </div>

      {facts.length ? (
        <dl className="mt-[3.5mm] grid grid-cols-[auto_1fr] gap-x-[4mm] gap-y-[0.6mm] rounded-[2.5mm] bg-[#f6f3fc] px-[5mm] py-[2.5mm] text-[9pt]">
          {facts.map((fact) => (
            <div key={fact.en} className="contents">
              <dt className="text-[#5b4b70]">
                {fact.th} <span className="font-[family-name:var(--font-latin)] text-[8pt]">/ {fact.en}</span>
              </dt>
              <dd className="font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <ol className="mt-[4mm] flex flex-1 flex-col gap-[2.6mm]">
        {sections.map((section, index) => {
          const Icon = RULE_ICONS[section.id];
          const alert = section.id === "misconduct";
          return (
            <li key={section.id} className="flex gap-[3.5mm] break-inside-avoid">
              <span
                className={
                  alert
                    ? "flex h-[8.5mm] w-[8.5mm] shrink-0 items-center justify-center rounded-full bg-[#fde8ec] text-[#be123c]"
                    : "flex h-[8.5mm] w-[8.5mm] shrink-0 items-center justify-center rounded-full bg-[#ede7f9] text-[#4F0080]"
                }
              >
                <Icon className="h-[4.6mm] w-[4.6mm]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[11pt] leading-tight font-bold">
                  {index + 1}. {section.title.th}{" "}
                  <span lang="en" className="font-[family-name:var(--font-latin)] text-[9pt] font-semibold text-[#5b4b70]">
                    · {section.title.en}
                  </span>
                </h2>
                <ul className="mt-[1mm] flex flex-col gap-[0.9mm]">
                  {section.items.map((item) => (
                    <li key={item.en} className="relative pl-[3.5mm] before:absolute before:top-[1.9mm] before:left-0 before:h-[1.2mm] before:w-[1.2mm] before:rounded-full before:bg-[#a685e1]">
                      <p className="text-[9.5pt] leading-snug">{item.th}</p>
                      <p lang="en" className="font-[family-name:var(--font-latin)] text-[7.5pt] leading-snug text-[#5b4b70]">
                        {item.en}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="mt-[3mm] border-t border-[#dccff4] pt-[2.5mm] text-[7.5pt] leading-snug text-[#5b4b70]">
        ตามข้อบังคับของสถาบันว่าด้วยการสอบ · กรรมการคุมสอบแจ้งข้อปฏิบัตินี้ให้นักศึกษาทราบก่อนเริ่มสอบทุกครั้ง ทั้งทางวาจาและลายลักษณ์อักษร
        <span lang="en" className="block font-[family-name:var(--font-latin)]">
          Based on the Institute&apos;s examination regulations. Invigilators announce these rules before every exam, aloud and in writing.
        </span>
      </footer>
    </article>
  );
}
