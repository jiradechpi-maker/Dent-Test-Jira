import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-thai/400.css";
import "@fontsource/ibm-plex-sans-thai/500.css";
import "@fontsource/ibm-plex-sans-thai/600.css";
import "@fontsource/ibm-plex-sans-thai/700.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { getLocale, getT } from "@/lib/i18n/server";
import { Providers } from "./providers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: {
      default: t("DentOps · คณะทันตแพทยศาสตร์ สจล.", "DentOps · Faculty of Dentistry, KMITL"),
      template: "%s · DentOps",
    },
    description: t(
      "ระบบบริหารจัดการงานวิชาการและเอกสารอัตโนมัติ คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
      "Academic operations and document automation for the Faculty of Dentistry, King Mongkut's Institute of Technology Ladkrabang",
    ),
    applicationName: "DentOps",
    icons: { icon: "/brand/kmitl-emblem.jpeg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#4F0080",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
