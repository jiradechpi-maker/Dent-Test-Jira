import { Skeleton } from "@/components/ui/skeleton";
import { getT } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getT();

  return (
    <div
      className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6"
      aria-busy="true"
      aria-label={t("กำลังโหลด", "Loading")}
    >
      <Skeleton className="h-9 w-64" />
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-40 lg:col-span-2" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
