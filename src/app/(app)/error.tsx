"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-base font-semibold">เกิดข้อผิดพลาดบางอย่าง</h2>
      <p className="max-w-md text-sm text-muted-foreground">ระบบบันทึกปัญหาไว้แล้ว ลองใหม่อีกครั้งได้เลย</p>
      <Button onClick={reset}>
        <RefreshCw aria-hidden /> ลองใหม่
      </Button>
    </div>
  );
}
