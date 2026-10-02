import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  filename?: string;
  quality?: number; // JPEG quality (default 0.98)
  scale?: number;   // html2canvas scale (default 2 for crisp 192 DPI on 96 DPI base)
}

/**
 * Generates a PDF Blob from an array of A4 HTML page elements.
 * Each element is captured at high resolution and placed onto an A4 PDF page (210 x 297 mm).
 */
export async function generatePdfFromElements(
  pageElements: HTMLElement[],
  options: GeneratePdfOptions = {}
): Promise<{ blob: Blob; blobUrl: string }> {
  if (!pageElements || pageElements.length === 0) {
    throw new Error('No page elements provided for PDF generation');
  }

  // Ensure all web fonts (Google Font Sarabun) are fully loaded
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check timed out or failed, proceeding with PDF generation', e);
    }
  }

  // Ensure all images (Garuda, signatures, logos) are loaded
  const imagePromises: Promise<void>[] = [];
  pageElements.forEach((page) => {
    const imgs = page.querySelectorAll('img');
    imgs.forEach((img) => {
      if (!img.complete) {
        imagePromises.push(
          new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
        );
      }
    });
  });

  if (imagePromises.length > 0) {
    await Promise.all(imagePromises);
  }

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  });

  const scale = options.scale ?? 2;
  const quality = options.quality ?? 0.98;

  for (let i = 0; i < pageElements.length; i++) {
    const el = pageElements[i];

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      ignoreElements: (element) => {
        // Exclude interactive guides, badges, rulers, and non-print overlays
        return (
          element.classList?.contains('no-print') ||
          element.classList?.contains('guide-badge') ||
          element.classList?.contains('guide-line-v') ||
          element.classList?.contains('guide-line-h') ||
          element.classList?.contains('center-axis')
        );
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);
    // Standard A4 portrait in mm: 210mm wide x 297mm high
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return { blob, blobUrl };
}

/**
 * Triggers direct client-side download of a PDF Blob without using window.print()
 * or window.open(), completely avoiding iframe sandbox and popup blocks.
 */
export function downloadPdfBlob(blobOrUrl: Blob | string, filename: string): void {
  const downloadName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);

  const link = document.createElement('a');
  link.href = url;
  link.download = downloadName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup DOM
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    // Only revoke if we created a temporary URL
    if (typeof blobOrUrl !== 'string') {
      URL.revokeObjectURL(url);
    }
  }, 100);
}
