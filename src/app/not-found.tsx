import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-[family-name:var(--font-latin)] text-5xl font-semibold text-brand-600">404</p>
      <h1 className="text-lg font-semibold">{t("ไม่พบหน้าที่ต้องการ", "Page not found")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายแล้ว", "The link may be incorrect, or the page may have moved.")}
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        {t("กลับหน้าแรก", "Back to home")}
      </Link>
    </main>
  );
}
