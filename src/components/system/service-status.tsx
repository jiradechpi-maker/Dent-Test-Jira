"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthResponse {
  ok: boolean;
  services: { pdf: { configured: boolean; healthy: boolean } };
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<HealthResponse> => {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as HealthResponse;
    },
    refetchInterval: 60_000,
  });
}

export function ServiceStatusList() {
  const health = useHealth();

  if (health.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (health.isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-danger-bg px-3 py-2 text-xs text-danger">
        <span>ตรวจสอบสถานะระบบไม่สำเร็จ</span>
        <Button variant="secondary" size="sm" onClick={() => void health.refetch()}>
          <RefreshCw aria-hidden /> ลองใหม่
        </Button>
      </div>
    );
  }

  const pdf = health.data.services.pdf;
  const rows = [
    { name: "เว็บแอปพลิเคชัน", ok: health.data.ok, text: "ทำงานปกติ" },
    { name: "สร้างไฟล์ Word (.docx)", ok: true, text: "พร้อมใช้งาน" },
    {
      name: "สร้าง PDF / สั่งพิมพ์",
      // Without a PDF server, letters are rendered, printed and saved as PDF in the browser.
      ok: true,
      text: pdf.healthy ? "พร้อมใช้งาน (เซิร์ฟเวอร์)" : pdf.configured ? "พร้อมใช้งาน (ในเบราว์เซอร์ — เซิร์ฟเวอร์ PDF ติดต่อไม่ได้)" : "พร้อมใช้งาน (ในเบราว์เซอร์)",
    },
  ];

  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((row) => (
        <li key={row.name} className="flex items-center justify-between gap-3 py-2 text-[13px]">
          <span className="flex items-center gap-2">
            {row.ok ? (
              <CheckCircle2 className="size-4 text-success" aria-hidden />
            ) : (
              <CircleAlert className="size-4 text-warning" aria-hidden />
            )}
            {row.name}
          </span>
          <Badge tone={row.ok ? "success" : "warning"}>{row.text}</Badge>
        </li>
      ))}
    </ul>
  );
}
