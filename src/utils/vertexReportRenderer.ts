/**
 * VERTEX Universal Report Renderer & Export Utility
 * Provides unified Arabic typography, RTL direction, and seamless PDF / Print rendering
 */

export const VERTEX_REPORT_FONT_STACK = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";

export interface ExportPdfOptions {
  filename: string;
  title?: string;
  scale?: number;
  orientation?: 'portrait' | 'landscape';
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (err: any) => void;
}

/**
 * Standardized High-Fidelity PDF Exporter for VERTEX Reports
 * Guarantees correct connected Arabic script, RTL orientation, and sharp typography
 */
export async function exportVertexReportToPdf(
  elementOrId: string | HTMLElement,
  options: ExportPdfOptions
): Promise<void> {
  const {
    filename,
    scale = 2,
    orientation = 'portrait',
    onStart,
    onComplete,
    onError
  } = options;

  try {
    if (onStart) onStart();

    const targetElement = typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

    if (!targetElement) {
      console.warn(`[VertexReportRenderer] Element '${elementOrId}' not found, falling back to window.print()`);
      window.print();
      if (onComplete) onComplete();
      return;
    }

    // Dynamic imports to optimize bundle size
    const [{ default: html2canvasMod }, jspdfMod] = await Promise.all([
      import('html2canvas-pro'),
      import('jspdf')
    ]);

    const jsPdfClass = (jspdfMod as any).jsPDF || (jspdfMod as any).default || jspdfMod;
    const renderCanvas = (html2canvasMod as any).default || html2canvasMod;

    // Render high DPI canvas with proper RTL and Arabic letter connection
    const canvas = await renderCanvas(targetElement, {
      scale: scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc: Document) => {
        // Enforce Arabic font and zero letter-spacing on cloned DOM so cursive glyphs never break
        const clonedEl = clonedDoc.getElementById(typeof elementOrId === 'string' ? elementOrId : targetElement.id);
        if (clonedEl) {
          clonedEl.style.fontFamily = VERTEX_REPORT_FONT_STACK;
          clonedEl.style.direction = 'rtl';
          clonedEl.style.letterSpacing = '0px';
          clonedEl.setAttribute('dir', 'rtl');
          clonedEl.setAttribute('lang', 'ar');

          // Ensure all child text elements inherit 0 letter spacing
          const allChildren = clonedEl.querySelectorAll('*');
          allChildren.forEach(child => {
            (child as HTMLElement).style.letterSpacing = '0px';
            (child as HTMLElement).style.fontFamily = VERTEX_REPORT_FONT_STACK;
          });
        }
      }
    });

    const pdf = new jsPdfClass({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate height of the image scaled to fit page width
    const imgHeight = (canvasHeight * pageWidth) / canvasWidth;

    if (imgHeight <= pageHeight) {
      // Fits on a single page
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
    } else {
      // Multi-page document handling
      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage('a4', orientation);
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);

    if (onComplete) onComplete();
  } catch (err) {
    console.error('[VertexReportRenderer] Error during PDF export:', err);
    if (onError) onError(err);
    // Fallback to browser print
    window.print();
    if (onComplete) onComplete();
  }
}

/**
 * Standardized Print Function for VERTEX Reports
 */
export function printVertexReport(
  elementOrId?: string | HTMLElement,
  options?: { title?: string }
): void {
  if (options?.title) {
    const originalTitle = document.title;
    document.title = options.title;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  } else {
    window.print();
  }
}
