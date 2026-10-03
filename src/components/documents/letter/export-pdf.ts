import { saveBlob } from "@/lib/invitation/client";
import { PRINT_ROOT_ID } from "./letter-document";

let fontCss: Promise<string> | null = null;

/** The letter font as inline data so the captured pages never fall back to another font. */
function letterFontCss(): Promise<string> {
  fontCss ??= (async () => {
    const face = async (url: string, weight: number) => {
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return `@font-face{font-family:"DentOps Sarabun";font-weight:${weight};font-style:normal;src:url(data:font/ttf;base64,${btoa(binary)}) format("truetype");}`;
    };
    return (await Promise.all([face("/fonts/THSarabunNew.ttf", 400), face("/fonts/THSarabunNew_Bold.ttf", 700)])).join("\n");
  })();
  return fontCss;
}

/**
 * Builds the PDF in the browser (no server needed): each real-size page is rendered by the browser
 * itself — so Thai shaping, line breaks and fonts are exactly what the preview shows — at 3× (≈ 290 dpi)
 * and placed edge to edge on an A4 page.
 */
export async function exportLetterPdf(fileName: string, title: string): Promise<void> {
  const root = document.getElementById(PRINT_ROOT_ID);
  const pages = root ? [...root.querySelectorAll<HTMLElement>("[data-letter-page]")] : [];
  // Never shown: the caller falls back to the print dialog on any failure.
  if (pages.length === 0) throw new Error("exportLetterPdf: no letter pages to capture");

  await document.fonts.ready;
  const [{ toPng }, { jsPDF }, fontEmbedCSS] = await Promise.all([import("html-to-image"), import("jspdf"), letterFontCss()]);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  // i18n-exempt: document properties belong to the official Thai letter, so they stay Thai whatever the UI language.
  pdf.setProperties({ title, creator: "DentOps — คณะทันตแพทยศาสตร์ สจล." });
  for (const [index, page] of pages.entries()) {
    const png = await toPng(page, { pixelRatio: 3, backgroundColor: "#ffffff", fontEmbedCSS, cacheBust: false });
    if (index > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(png, "PNG", 0, 0, 210, 297, undefined, "FAST");
  }
  saveBlob(pdf.output("blob"), fileName);
}
