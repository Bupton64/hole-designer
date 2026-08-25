import { Shape, TextShape } from "@/store/canvasStore";
import { SponsorTemplate, HoleDesign, CanvasData } from "@/types/project";
import { shapesToSvg } from "./svgSerializer";
import { ARTBOARD_WIDTH, ARTBOARD_HEIGHT } from "@/components/canvas/Canvas";

/**
 * Token substitution for info banner text shapes.
 */
function substituteTokens(
  text: string,
  data: { hole: number; par: number; distance: number; ob: string; mando: string; name: string }
): string {
  return text
    .replace(/\{\{hole\}\}/g, String(data.hole))
    .replace(/\{\{par\}\}/g, String(data.par))
    .replace(/\{\{distance\}\}/g, data.distance > 0 ? `${data.distance}m` : "")
    .replace(/\{\{ob\}\}/g, data.ob)
    .replace(/\{\{mando\}\}/g, data.mando)
    .replace(/\{\{name\}\}/g, data.name);
}

/**
 * Applies token substitution to all text shapes in a canvas.
 */
function substituteCanvasTokens(
  canvas: CanvasData,
  tokenData: { hole: number; par: number; distance: number; ob: string; mando: string; name: string }
): CanvasData {
  return {
    ...canvas,
    shapes: canvas.shapes.map((shape) => {
      if (shape.type === "text") {
        return { ...shape, text: substituteTokens(shape.text, tokenData) };
      }
      return shape;
    }),
  };
}

/**
 * Computes the full composed page dimensions.
 */
export function getComposedPageDimensions(template: SponsorTemplate) {
  return {
    width: ARTBOARD_WIDTH,
    height:
      template.topBarHeight +
      ARTBOARD_HEIGHT +
      template.infoBanner.height +
      template.bottomBarHeight,
  };
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Renders a CanvasData (shapes) as SVG elements with a Y offset.
 * Simplified: only handles text and image shapes (what banners typically contain).
 */
function bannerShapesToSvgElements(canvas: CanvasData, offsetY: number): string {
  const elements: string[] = [];

  // Background rect
  elements.push(
    `  <rect x="0" y="${offsetY}" width="${ARTBOARD_WIDTH}" height="100%" fill="${escapeAttr(canvas.backgroundColor)}" />`
  );

  for (const shape of canvas.shapes) {
    if (!shape.visible) continue;

    if (shape.type === "text") {
      const fontWeight = shape.fontStyle === "bold" ? ' font-weight="bold"' : "";
      const fontStyleAttr = shape.fontStyle === "italic" ? ' font-style="italic"' : "";
      elements.push(
        `  <text x="${shape.x}" y="${offsetY + shape.y + shape.fontSize}" font-family="${escapeAttr(shape.fontFamily)}" font-size="${shape.fontSize}" fill="${escapeAttr(shape.fill)}"${fontWeight}${fontStyleAttr}>${escapeAttr(shape.text)}</text>`
      );
    }

    if (shape.type === "image") {
      elements.push(
        `  <image href="${escapeAttr(shape.src)}" x="${shape.x}" y="${offsetY + shape.y}" width="${shape.width}" height="${shape.height}" />`
      );
    }
  }

  return elements.join("\n");
}

/**
 * Generates a full composed page SVG string.
 */
export function composedPageToSvg(
  template: SponsorTemplate,
  design: HoleDesign,
  canvasShapes: Shape[],
  canvasBackground: string,
  holeNumber: number,
  holeName: string
): string {
  const { width, height } = getComposedPageDimensions(template);
  const tokenData = {
    hole: holeNumber,
    par: design.par,
    distance: design.distance,
    ob: design.obRules,
    mando: design.mandoNotes,
    name: holeName,
  };

  const topBarOffset = 0;
  const canvasOffset = template.topBarHeight;
  const infoBannerOffset = template.topBarHeight + ARTBOARD_HEIGHT;
  const bottomBarOffset = infoBannerOffset + template.infoBanner.height;

  // Substitute tokens in info banner
  const infoBannerCanvas = substituteCanvasTokens(template.infoBanner.canvas, tokenData);

  // Build SVG sections
  const sections: string[] = [];

  // Top bar background + shapes
  sections.push(`  <rect x="0" y="${topBarOffset}" width="${width}" height="${template.topBarHeight}" fill="${escapeAttr(template.topBar.backgroundColor)}" />`);
  sections.push(bannerShapesToSvgElements(template.topBar, topBarOffset));

  // Main canvas area - use the full SVG serializer but wrap in a group with Y offset
  // We generate the inner SVG content without the XML header and outer SVG wrapper
  const canvasElements = canvasShapes
    .filter((s) => s.visible)
    .map((shape) => {
      // Reuse shapesToSvg but we need individual shape serialization
      // For now, generate a nested SVG for the canvas area
      return "";
    });

  // Use a foreignObject-like approach: render the canvas as a nested svg
  const canvasSvgContent = shapesToSvg(canvasShapes, ARTBOARD_WIDTH, ARTBOARD_HEIGHT, canvasBackground);
  // Extract the inner content (strip the outer SVG wrapper)
  const innerCanvasMatch = canvasSvgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const innerCanvas = innerCanvasMatch ? innerCanvasMatch[1] : "";

  sections.push(`  <svg x="0" y="${canvasOffset}" width="${ARTBOARD_WIDTH}" height="${ARTBOARD_HEIGHT}" viewBox="0 0 ${ARTBOARD_WIDTH} ${ARTBOARD_HEIGHT}">`);
  sections.push(innerCanvas);
  sections.push(`  </svg>`);

  // Info banner background + shapes (with tokens substituted)
  sections.push(`  <rect x="0" y="${infoBannerOffset}" width="${width}" height="${template.infoBanner.height}" fill="${escapeAttr(infoBannerCanvas.backgroundColor)}" />`);
  sections.push(bannerShapesToSvgElements(infoBannerCanvas, infoBannerOffset));

  // Bottom bar background + shapes
  sections.push(`  <rect x="0" y="${bottomBarOffset}" width="${width}" height="${template.bottomBarHeight}" fill="${escapeAttr(template.bottomBar.backgroundColor)}" />`);
  sections.push(bannerShapesToSvgElements(template.bottomBar, bottomBarOffset));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${sections.join("\n")}
</svg>`;
}
