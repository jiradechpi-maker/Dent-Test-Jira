"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Skeleton } from "@/components/ui/skeleton";

// Worker is copied to /public on install (scripts/copy-pdf-worker.mjs) so it always matches the library.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/** Renders the real PDF (exactly what will be downloaded/printed) page by page. */
export default function PdfViewer({ file, onPages }: { file: Blob; onPages?: (count: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(240, Math.floor(w)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {error ? (
        <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger">
          แสดงพรีวิวไม่สำเร็จ: {error}
        </p>
      ) : (
        <Document
          file={file}
          loading={<Skeleton className="aspect-[1/1.414] w-full" />}
          onLoadSuccess={({ numPages }) => {
            setPages(numPages);
            setError(null);
            onPages?.(numPages);
          }}
          onLoadError={(e) => setError(e.message)}
          className="flex flex-col gap-4"
        >
          {Array.from({ length: pages }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-sm bg-white shadow-[var(--shadow-md)] ring-1 ring-neutral-200">
              <Page
                pageNumber={i + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<Skeleton className="aspect-[1/1.414] w-full" />}
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
