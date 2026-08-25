"use client";

import { useMemo } from "react";
import { Shape } from "@/store/canvasStore";
import { ARTBOARD_WIDTH, ARTBOARD_HEIGHT } from "@/components/canvas/Canvas";

interface HoleThumbnailProps {
  shapes: Shape[];
  backgroundColor: string;
  width?: number;
  height?: number;
}

/**
 * Renders a simplified SVG thumbnail of a hole design.
 * Only renders basic outlines/fills for visual recognition at small sizes.
 */
export function HoleThumbnail({
  shapes,
  backgroundColor,
  width = 120,
  height = 180,
}: HoleThumbnailProps) {
  const svgContent = useMemo(() => {
    const elements: string[] = [];

    for (const shape of shapes) {
      if (!shape.visible) continue;

      switch (shape.type) {
        case "rectangle":
          elements.push(
            `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />`
          );
          break;

        case "ellipse":
          elements.push(
            `<ellipse cx="${shape.x}" cy="${shape.y}" rx="${shape.radiusX}" ry="${shape.radiusY}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />`
          );
          break;

        case "line":
          const points = shape.points
            .reduce<string[]>((acc, val, i) => {
              if (i % 2 === 0) acc.push(`${val + shape.x},${shape.points[i + 1] + shape.y}`);
              return acc;
            }, [])
            .join(" ");
          elements.push(
            `<polyline points="${points}" fill="none" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />`
          );
          break;

        case "asset": {
          const isCompound = Array.isArray(shape.paths) && shape.paths.length > 0;
          if (isCompound) {
            const vw = shape.viewboxWidth ?? 40;
            const vh = shape.viewboxHeight ?? 40;
            const sx = shape.width / vw;
            const sy = shape.height / vh;
            const subPaths = shape.paths!.map(
              (p) => `<path d="${p.d}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" />`
            ).join("");
            elements.push(
              `<g transform="translate(${shape.x},${shape.y}) scale(${sx},${sy})">${subPaths}</g>`
            );
          } else if (shape.svgPath) {
            const vw = shape.viewboxWidth ?? 40;
            const vh = shape.viewboxHeight ?? 40;
            const sx = shape.width / vw;
            const sy = shape.height / vh;
            elements.push(
              `<g transform="translate(${shape.x},${shape.y}) scale(${sx},${sy})"><path d="${shape.svgPath}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" /></g>`
            );
          }
          break;
        }

        case "fairway": {
          // Simplified: just draw the spine as a thick green line
          const spinePoints = shape.spinePoints
            .reduce<string[]>((acc, val, i) => {
              if (i % 2 === 0) acc.push(`${val + shape.x},${shape.spinePoints[i + 1] + shape.y}`);
              return acc;
            }, [])
            .join(" ");
          elements.push(
            `<polyline points="${spinePoints}" fill="none" stroke="${shape.midFill}" stroke-width="${shape.maxWidth * 0.4}" stroke-linecap="round" stroke-linejoin="round" />`
          );
          break;
        }

        case "obline": {
          const obPoints = shape.points
            .reduce<string[]>((acc, val, i) => {
              if (i % 2 === 0) acc.push(`${val + shape.x},${shape.points[i + 1] + shape.y}`);
              return acc;
            }, [])
            .join(" ");
          elements.push(
            `<polyline points="${obPoints}" fill="none" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" stroke-dasharray="8 6" />`
          );
          break;
        }

        case "stream": {
          const streamPoints = shape.points
            .reduce<string[]>((acc, val, i) => {
              if (i % 2 === 0) acc.push(`${val + shape.x},${shape.points[i + 1] + shape.y}`);
              return acc;
            }, [])
            .join(" ");
          elements.push(
            `<polyline points="${streamPoints}" fill="none" stroke="${shape.fillStroke}" stroke-width="${shape.fillWidth}" stroke-linecap="round" />`
          );
          break;
        }

        case "text":
          elements.push(
            `<text x="${shape.x}" y="${shape.y + shape.fontSize}" font-size="${shape.fontSize}" fill="${shape.fill}" font-family="${shape.fontFamily}">${shape.text}</text>`
          );
          break;

        case "image":
          // Show a placeholder rect for images
          elements.push(
            `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1" />`
          );
          break;
      }
    }

    return elements.join("\n");
  }, [shapes]);

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ARTBOARD_WIDTH} ${ARTBOARD_HEIGHT}" width="${width}" height="${height}">
<rect width="${ARTBOARD_WIDTH}" height="${ARTBOARD_HEIGHT}" fill="${backgroundColor}" />
${svgContent}
</svg>`;

  // Use a data URI for the SVG to avoid XSS concerns with dangerouslySetInnerHTML
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  return (
    <img
      src={dataUri}
      alt="Hole thumbnail"
      width={width}
      height={height}
      className="rounded-md"
      style={{ imageRendering: "auto" }}
    />
  );
}
