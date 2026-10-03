"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { InvitationTemplateData } from "@/lib/invitation/template-data";
import { AttachmentHeader, ExamSection, LetterPages, ScheduleTable, SINGLE_PAGE_LAYOUT, T, letterStyles as styles, type AttachmentLayout } from "./letter-pages";

export const PRINT_ROOT_ID = "letter-print-root";
const PAGE_WIDTH_PX = (21 / 2.54) * 96;
const PAGE_HEIGHT_PX = (29.7 / 2.54) * 96;

/**
 * Measures the attachment (header, each schedule row, exam section) at real size and spreads the rows
 * over as many A4 pages as needed — the table header repeats on every page, rows and the exam section
 * never split, just like the .docx (tableHeader + cantSplit + keep-together).
 */
export function useAttachmentLayout(
  data: InvitationTemplateData | null,
  protectedWords: string[],
): { layout: AttachmentLayout | null; measurer: React.ReactNode } {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<AttachmentLayout | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.all([document.fonts.load('16pt "DentOps Sarabun"'), document.fonts.load('bold 16pt "DentOps Sarabun"')])
      .catch(() => undefined)
      .then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    const page = ref.current;
    if (!page || !data) return;
    const style = getComputedStyle(page);
    const capacity = page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 4;
    const height = (selector: string) => (page.querySelector(selector) as HTMLElement | null)?.getBoundingClientRect().height ?? 0;
    const header = height("[data-part=header]");
    const thead = height("thead");
    const exam = data.hasExam ? height("[data-part=exam]") : 0;
    const rows = data.schedule.map((_, i) => height(`tr[data-row="${i}"]`));

    const pages: number[][] = [[]];
    let used = header + thead;
    rows.forEach((rowHeight, index) => {
      if (used + rowHeight > capacity && pages.at(-1)!.length > 0) {
        pages.push([]);
        used = thead;
      }
      pages.at(-1)!.push(index);
      used += rowHeight;
    });
    let examPage = pages.length - 1;
    if (exam > 0 && used + exam > capacity) {
      pages.push([]);
      examPage = pages.length - 1;
    }
    setLayout({ pages, examPage });
  }, [data, protectedWords, fontsReady]);

  const t = (text: string) => <T words={protectedWords}>{text}</T>;

  const measurer = data ? (
    <div aria-hidden style={{ position: "fixed", left: -100_000, top: 0, visibility: "hidden", pointerEvents: "none" }}>
      <div ref={ref} className={styles.page}>
        <div data-part="header">
          <AttachmentHeader data={data} t={t} />
        </div>
        <ScheduleTable data={data} rows={data.schedule.map((_, i) => i)} t={t} />
        <div data-part="exam">{data.hasExam ? <ExamSection data={data} t={t} /> : null}</div>
      </div>
    </div>
  ) : null;

  return { layout, measurer };
}

/** On-screen preview: the real-size pages scaled down to the panel width. */
export function LetterPreview({ data, protectedWords, layout }: { data: InvitationTemplateData; protectedWords: string[]; layout: AttachmentLayout | null }) {
  const outer = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const effective = layout ?? SINGLE_PAGE_LAYOUT(data.schedule.length);
  const pageCount = 1 + effective.pages.length;
  const scale = width / PAGE_WIDTH_PX;
  const gap = 16;

  return (
    <div ref={outer} className="w-full" style={{ height: pageCount * PAGE_HEIGHT_PX * scale + (pageCount - 1) * gap }}>
      <div
        className="flex flex-col [&>section]:shadow-[var(--shadow-md)] [&>section]:ring-1 [&>section]:ring-neutral-200"
        style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: "top left", gap: gap / scale }}
      >
        <LetterPages data={data} protectedWords={protectedWords} layout={effective} />
      </div>
    </div>
  );
}

/**
 * Real-size pages kept off-screen: what the browser prints (Ctrl+P / "บันทึกเป็น PDF") and what the
 * in-browser PDF export captures. Rendered straight into <body> so print CSS can hide everything else.
 */
export function LetterPrintRoot({ data, protectedWords, layout }: { data: InvitationTemplateData; protectedWords: string[]; layout: AttachmentLayout | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pages = useMemo(
    () => <LetterPages data={data} protectedWords={protectedWords} layout={layout ?? undefined} />,
    [data, protectedWords, layout],
  );
  if (!mounted) return null;
  return createPortal(
    <div id={PRINT_ROOT_ID} style={{ position: "fixed", left: -100_000, top: 0 }}>
      {pages}
    </div>,
    document.body,
  );
}

export function letterPageCount(layout: AttachmentLayout | null, rows: number): number {
  return 1 + (layout ?? SINGLE_PAGE_LAYOUT(rows)).pages.length;
}
