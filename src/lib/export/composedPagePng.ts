import { SponsorTemplate, HoleDesign } from "@/types/project";
import { Shape } from "@/store/canvasStore";
import { composedPageToSvg, getComposedPageDimensions } from "./composedPageExport";

/**
 * Renders a composed page to a PNG data URL by:
 * 1. Generating the SVG
 * 2. Drawing it onto a canvas at high resolution
 * 3. Exporting the canvas as PNG
 */
export async function composedPageToPng(
  template: SponsorTemplate,
  design: HoleDesign,
  canvasShapes: Shape[],
  canvasBackground: string,
  holeNumber: number,
  holeName: string,
  pixelRatio: number = 4
): Promise<string> {
  const { width, height } = getComposedPageDimensions(template);
  const svg = composedPageToSvg(
    template,
    design,
    canvasShapes,
    canvasBackground,
    holeNumber,
    holeName
  );

  // Create a blob URL from the SVG
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Draw SVG onto a high-res canvas
  const img = new window.Image();
  img.width = width;
  img.height = height;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.scale(pixelRatio, pixelRatio);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG as image"));
    };
    img.src = url;
  });

  return dataUrl;
}

/**
 * Renders a composed page to a PNG Blob (for PDF embedding).
 */
export async function composedPageToPngBlob(
  template: SponsorTemplate,
  design: HoleDesign,
  canvasShapes: Shape[],
  canvasBackground: string,
  holeNumber: number,
  holeName: string,
  pixelRatio: number = 4
): Promise<Blob> {
  const { width, height } = getComposedPageDimensions(template);
  const svg = composedPageToSvg(
    template,
    design,
    canvasShapes,
    canvasBackground,
    holeNumber,
    holeName
  );

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new window.Image();
  img.width = width;
  img.height = height;

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.scale(pixelRatio, pixelRatio);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => {
          URL.revokeObjectURL(url);
          if (b) resolve(b);
          else reject(new Error("Failed to create PNG blob"));
        },
        "image/png"
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG as image"));
    };
    img.src = url;
  });

  return pngBlob;
}
