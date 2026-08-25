import { PDFDocument } from "pdf-lib";
import { Project, SponsorTemplate, HoleDesign } from "@/types/project";
import { composedPageToPngBlob, composedPageToPng } from "./composedPagePng";
import { getComposedPageDimensions } from "./composedPageExport";

interface BatchExportProgress {
  current: number;
  total: number;
  holeName: string;
}

/**
 * Batch exports all holes for a given layout as a multi-page PDF.
 * Each page is a composed hole page rendered as a PNG embedded in the PDF.
 *
 * @param project - The full project data
 * @param layoutId - Which layout to export
 * @param onProgress - Optional callback for progress updates
 * @returns PDF as a Uint8Array (ready to download)
 */
export async function batchExportPdf(
  project: Project,
  layoutId: string,
  onProgress?: (progress: BatchExportProgress) => void
): Promise<Uint8Array> {
  const { width, height } = getComposedPageDimensions(project.sponsorTemplate);

  // Sort holes by number
  const sortedHoles = [...project.holes].sort((a, b) => a.number - b.number);

  // Filter to holes that have a design for this layout
  const holesWithDesigns = sortedHoles
    .map((hole) => {
      const design = hole.designs.find((d) => d.layoutId === layoutId);
      return design ? { hole, design } : null;
    })
    .filter((x): x is { hole: typeof sortedHoles[0]; design: HoleDesign } => x !== null);

  if (holesWithDesigns.length === 0) {
    throw new Error("No hole designs found for this layout");
  }

  // Create PDF document
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < holesWithDesigns.length; i++) {
    const { hole, design } = holesWithDesigns[i];

    onProgress?.({
      current: i + 1,
      total: holesWithDesigns.length,
      holeName: `Hole ${hole.number}${hole.name ? ` - ${hole.name}` : ""}`,
    });

    // Render the composed page as PNG blob
    const pngBlob = await composedPageToPngBlob(
      project.sponsorTemplate,
      design,
      design.canvas.shapes,
      design.canvas.backgroundColor,
      hole.number,
      hole.name,
      3 // 3x for PDF (balance of quality vs file size)
    );

    // Convert blob to array buffer
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

    // Embed PNG in PDF
    const pngImage = await pdfDoc.embedPng(pngBytes);

    // Add page with dimensions matching the composed page aspect ratio
    // PDF points: 72 points per inch. Use a reasonable page size.
    // Scale to fit standard paper or use exact pixel dimensions scaled to points
    const pageWidth = width * 0.75; // pixels to points (approx 96dpi -> 72dpi)
    const pageHeight = height * 0.75;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  // Serialize PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Helper: triggers a download of the PDF bytes.
 */
export function downloadPdf(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes.slice()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
