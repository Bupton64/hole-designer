import { Shape } from "@/store/canvasStore";
import { generateFairwayGeometry, smoothSpine } from "@/lib/fairwayGeometry";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildTransform(shape: Shape): string {
  const parts: string[] = [];

  if (shape.x !== 0 || shape.y !== 0) {
    parts.push(`translate(${shape.x}, ${shape.y})`);
  }

  if (shape.rotation !== 0) {
    switch (shape.type) {
      case "rectangle":
        parts.push(`rotate(${shape.rotation}, ${shape.width / 2}, ${shape.height / 2})`);
        break;
      case "ellipse":
        parts.push(`rotate(${shape.rotation})`);
        break;
      case "line":
        parts.push(`rotate(${shape.rotation})`);
        break;
      case "asset":
        parts.push(`rotate(${shape.rotation}, ${shape.width / 2}, ${shape.height / 2})`);
        break;
      case "text":
        parts.push(`rotate(${shape.rotation})`);
        break;
    }
  }

  return parts.length > 0 ? ` transform="${parts.join(" ")}"` : "";
}

function shapeToSvg(shape: Shape): string {
  if (!shape.visible) return "";

  const transform = buildTransform(shape);

  switch (shape.type) {
    case "rectangle":
      return `  <rect x="0" y="0" width="${shape.width}" height="${shape.height}" fill="${escapeAttr(shape.fill)}" stroke="${escapeAttr(shape.stroke)}" stroke-width="${shape.strokeWidth}"${transform} />`;

    case "ellipse":
      return `  <ellipse cx="0" cy="0" rx="${shape.radiusX}" ry="${shape.radiusY}" fill="${escapeAttr(shape.fill)}" stroke="${escapeAttr(shape.stroke)}" stroke-width="${shape.strokeWidth}"${transform} />`;

    case "line": {
      const points = shape.points
        .reduce<string[]>((acc, val, i) => {
          if (i % 2 === 0) {
            acc.push(`${val},${shape.points[i + 1]}`);
          }
          return acc;
        }, [])
        .join(" ");

      const fill = shape.closed ? escapeAttr(shape.fill) : "none";
      const tag = shape.closed ? "polygon" : "polyline";

      return `  <${tag} points="${points}" fill="${fill}" stroke="${escapeAttr(shape.stroke)}" stroke-width="${shape.strokeWidth}"${transform} />`;
    }

    case "asset": {
      const isCompound = Array.isArray(shape.paths) && shape.paths.length > 0;
      if (isCompound) {
        const viewboxW = shape.viewboxWidth ?? 40;
        const viewboxH = shape.viewboxHeight ?? 40;
        const sx = shape.width / viewboxW;
        const sy = shape.height / viewboxH;
        const groupTransform = buildTransform(shape) || ` transform="translate(${shape.x}, ${shape.y})"`;
        const scaleTransform = `scale(${sx}, ${sy})`;
        const subPaths = shape.paths!.map((p) => {
          const dashAttr = p.dash ? ` stroke-dasharray="${p.dash.join(" ")}"` : "";
          const opacityAttr = p.opacity != null && p.opacity !== 1 ? ` opacity="${p.opacity}"` : "";
          const fillVal = p.fill === "none" ? "none" : escapeAttr(p.fill);
          const strokeVal = p.stroke === "none" ? "none" : escapeAttr(p.stroke);
          return `    <path d="${p.d}" fill="${fillVal}" stroke="${strokeVal}" stroke-width="${p.strokeWidth}"${dashAttr}${opacityAttr} />`;
        }).join("\n");
        return `  <g${groupTransform}>\n    <g transform="${scaleTransform}">\n${subPaths}\n    </g>\n  </g>`;
      }
      const fillAttr = shape.fill === "none" ? "none" : escapeAttr(shape.fill);
      return `  <path d="${shape.svgPath}" fill="${fillAttr}" stroke="${escapeAttr(shape.stroke)}" stroke-width="${shape.strokeWidth}"${transform} />`;
    }

    case "text": {
      const fontWeight = shape.fontStyle === "bold" ? "font-weight=\"bold\"" : "";
      const fontStyleAttr = shape.fontStyle === "italic" ? "font-style=\"italic\"" : "";
      const attrs = [fontWeight, fontStyleAttr].filter((a) => a.length > 0).join(" ");
      return `  <text x="0" y="${shape.fontSize}" font-family="${escapeAttr(shape.fontFamily)}" font-size="${shape.fontSize}" fill="${escapeAttr(shape.fill)}"${attrs ? " " + attrs : ""}${transform}>${escapeAttr(shape.text)}</text>`;
    }

    case "fairway": {
      const smoothed = smoothSpine(shape.spinePoints, 8);
      const geometry = generateFairwayGeometry(smoothed, shape.maxWidth);
      const toPolyPoints = (pts: number[]) => {
        const pairs: string[] = [];
        for (let i = 0; i < pts.length; i += 2) {
          pairs.push(`${pts[i]},${pts[i + 1]}`);
        }
        return pairs.join(" ");
      };
      const outerPoly = `  <polygon points="${toPolyPoints(geometry.outer)}" fill="${escapeAttr(shape.outerFill)}"${transform} />`;
      const midPoly = `  <polygon points="${toPolyPoints(geometry.mid)}" fill="${escapeAttr(shape.midFill)}"${transform} />`;
      const innerPoly = `  <polygon points="${toPolyPoints(geometry.inner)}" fill="${escapeAttr(shape.innerFill)}"${transform} />`;
      return `${outerPoly}\n${midPoly}\n${innerPoly}`;
    }

    case "obline": {
      const points = shape.points
        .reduce<string[]>((acc, val, i) => {
          if (i % 2 === 0) {
            acc.push(`${val},${shape.points[i + 1]}`);
          }
          return acc;
        }, [])
        .join(" ");
      const dashAttr = shape.dash ? ` stroke-dasharray="${shape.dash.join(" ")}"` : "";
      return `  <polyline points="${points}" fill="none" stroke="${escapeAttr(shape.stroke)}" stroke-width="${shape.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${dashAttr}${transform} />`;
    }

    case "stream": {
      const smoothed = smoothSpine(shape.points, 8);
      const points = smoothed
        .reduce<string[]>((acc, val, i) => {
          if (i % 2 === 0) {
            acc.push(`${val},${smoothed[i + 1]}`);
          }
          return acc;
        }, [])
        .join(" ");
      const edgeLine = `  <polyline points="${points}" fill="none" stroke="${escapeAttr(shape.edgeStroke)}" stroke-width="${shape.fillWidth + shape.edgeWidth * 2}" stroke-linecap="round" stroke-linejoin="round"${transform} />`;
      const fillLine = `  <polyline points="${points}" fill="none" stroke="${escapeAttr(shape.fillStroke)}" stroke-width="${shape.fillWidth}" stroke-linecap="round" stroke-linejoin="round"${transform} />`;
      return `${edgeLine}\n${fillLine}`;
    }

    case "image": {
      // Export as an SVG image element with the src URL (works for local viewing)
      return `  <image href="${escapeAttr(shape.src)}" x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}"${shape.rotation ? ` transform="rotate(${shape.rotation}, ${shape.x + shape.width / 2}, ${shape.y + shape.height / 2})"` : ""} />`;
    }
  }

  return "";
}

export function shapesToSvg(shapes: Shape[], width: number, height: number, backgroundColor: string = "#ffffff"): string {
  const elements = shapes
    .map(shapeToSvg)
    .filter((s) => s.length > 0)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${escapeAttr(backgroundColor)}" />
${elements}
</svg>`;
}
