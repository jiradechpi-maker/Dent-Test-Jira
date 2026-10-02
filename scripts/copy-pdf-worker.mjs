// Copies the pdf.js worker that matches the installed pdfjs-dist version into /public,
// so the PDF preview never depends on a CDN and always matches the library version.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

try {
  const pkgDir = dirname(require.resolve("pdfjs-dist/package.json", { paths: [require.resolve("react-pdf")] }));
  const src = join(pkgDir, "build", "pdf.worker.min.mjs");
  if (!existsSync(src)) {
    console.warn("[copy-pdf-worker] worker not found at", src);
    process.exit(0);
  }
  mkdirSync("public", { recursive: true });
  copyFileSync(src, join("public", "pdf.worker.min.mjs"));
  console.log("[copy-pdf-worker] copied pdf.worker.min.mjs to /public");
} catch (error) {
  console.warn("[copy-pdf-worker] skipped:", error instanceof Error ? error.message : error);
}
