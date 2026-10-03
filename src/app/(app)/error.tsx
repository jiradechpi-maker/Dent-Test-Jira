"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-base font-semibold">{t("เกิดข้อผิดพลาดบางอย่าง", "Something went wrong")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("ระบบบันทึกปัญหาไว้แล้ว ลองใหม่อีกครั้งได้เลย", "The problem has been logged. Please try again.")}
      </p>
      <Button onClick={reset}>
        <RefreshCw aria-hidden /> {t("ลองใหม่", "Try again")}
      </Button>
    </div>
  );
}
