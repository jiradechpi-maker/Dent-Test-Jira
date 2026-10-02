import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-[family-name:var(--font-latin)] text-5xl font-semibold text-brand-600">404</p>
      <h1 className="text-lg font-semibold">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-sm text-muted-foreground">ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายแล้ว</p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        กลับหน้าแรก
      </Link>
    </main>
  );
}
