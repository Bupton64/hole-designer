/**
 * Fairway Geometry Generator
 *
 * Takes a series of spine points (the center line of the fairway) and generates
 * offset curves at multiple widths to create the layered fairway shape.
 *
 * The fairway:
 * - Starts as a single point at the tee (tapers to nothing)
 * - Gradually widens along the spine
 * - Ends with a semicircle at the basket end
 * - Has 3 nested layers: outer (dark), mid, inner (lightest)
 *
 * The output is Konva-compatible point arrays for filled shapes.
 */

interface Point {
  x: number;
  y: number;
}

/**
 * Convert flat point array [x1, y1, x2, y2, ...] to Point[]
 */
function toPoints(flat: number[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < flat.length - 1; i += 2) {
    points.push({ x: flat[i], y: flat[i + 1] });
  }
  return points;
}

/**
 * Get the perpendicular normal at a point along the spine.
 * Uses the average of the directions to/from neighboring points.
 */
function getNormal(points: Point[], index: number): Point {
  let dx = 0;
  let dy = 0;

  if (index === 0 && points.length > 1) {
    dx = points[1].x - points[0].x;
    dy = points[1].y - points[0].y;
  } else if (index === points.length - 1 && points.length > 1) {
    dx = points[index].x - points[index - 1].x;
    dy = points[index].y - points[index - 1].y;
  } else if (points.length > 2) {
    dx = points[index + 1].x - points[index - 1].x;
    dy = points[index + 1].y - points[index - 1].y;
  }

  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: -1 };

  // Perpendicular (rotated 90 degrees)
  return { x: -dy / len, y: dx / len };
}

/**
 * Calculate the width at a given position along the spine (0 = tee, 1 = basket).
 * Uses a power curve so the taper is smooth and the end bulges out.
 */
function getWidthAtT(t: number, maxWidth: number, widthRatio: number): number {
  // Taper from 0 at tee to maxWidth * widthRatio at basket
  // Use sqrt for a nice gradual opening that accelerates toward the end
  return maxWidth * widthRatio * Math.pow(t, 0.6);
}

/**
 * Generate a full circle of points at the end of the fairway.
 */
function generateEndCircle(
  center: Point,
  radius: number,
  segments: number = 20
): Point[] {
  const points: Point[] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const px = center.x + radius * Math.cos(angle);
    const py = center.y + radius * Math.sin(angle);
    points.push({ x: px, y: py });
  }

  return points;
}

/**
 * Generate a semicircle at the end of the fairway, with the flat edge
 * aligned to the end of the corridor (facing forward along the spine direction).
 */
function generateEndSemicircle(
  center: Point,
  normal: Point,
  radius: number,
  segments: number = 16
): Point[] {
  const points: Point[] = [];
  // Tangent = forward direction along spine at the end (flipped to face outward)
  const tangentX = normal.y;
  const tangentY = -normal.x;

  // Semicircle from -90 to +90 degrees relative to the forward direction
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI * (i / segments) - Math.PI / 2;
    const px = center.x + radius * (Math.sin(angle) * normal.x + Math.cos(angle) * tangentX);
    const py = center.y + radius * (Math.sin(angle) * normal.y + Math.cos(angle) * tangentY);
    points.push({ x: px, y: py });
  }

  return points;
}

/**
 * Generate smooth offset points along one side of the spine using Catmull-Rom interpolation.
 */
function generateOffsetSide(
  spinePoints: Point[],
  maxWidth: number,
  widthRatio: number,
  side: 1 | -1,
  subdivisions: number = 3
): Point[] {
  const result: Point[] = [];
  const totalPoints = spinePoints.length;

  for (let i = 0; i < totalPoints; i++) {
    const t = totalPoints > 1 ? i / (totalPoints - 1) : 0;
    const width = getWidthAtT(t, maxWidth, widthRatio);
    const normal = getNormal(spinePoints, i);

    // Base offset point
    const basePoint = {
      x: spinePoints[i].x + normal.x * width * side,
      y: spinePoints[i].y + normal.y * width * side,
    };

    if (i === 0 && subdivisions > 0) {
      // At the tee, just add the single point (taper start)
      result.push(basePoint);
    } else if (i > 0 && subdivisions > 0) {
      // Add subdivided points between previous and current for smoothness
      const prevT = (i - 1) / (totalPoints - 1);
      const prevWidth = getWidthAtT(prevT, maxWidth, widthRatio);
      const prevNormal = getNormal(spinePoints, i - 1);
      const prevPoint = {
        x: spinePoints[i - 1].x + prevNormal.x * prevWidth * side,
        y: spinePoints[i - 1].y + prevNormal.y * prevWidth * side,
      };

      for (let s = 1; s <= subdivisions; s++) {
        const st = s / subdivisions;
        result.push({
          x: prevPoint.x + (basePoint.x - prevPoint.x) * st,
          y: prevPoint.y + (basePoint.y - prevPoint.y) * st,
        });
      }
    } else {
      result.push(basePoint);
    }
  }

  return result;
}

export interface FairwayGeometry {
  /** Outer (widest, darkest) fairway outline as flat point array */
  outer: number[];
  /** Mid fairway outline */
  mid: number[];
  /** Inner (narrowest, lightest) fairway outline */
  inner: number[];
}

/**
 * Generate the three layered fairway outlines from spine points.
 *
 * @param spineFlat - Flat array [x1, y1, x2, y2, ...] of spine center points.
 *                    First point = tee (narrow), last point = basket (wide semicircle).
 * @param maxWidth - Maximum half-width of the outer fairway at the basket end.
 * @returns Three closed polygon point arrays (outer, mid, inner).
 */
export function generateFairwayGeometry(
  spineFlat: number[],
  maxWidth: number
): FairwayGeometry {
  const spine = toPoints(spineFlat);

  if (spine.length < 2) {
    return { outer: [], mid: [], inner: [] };
  }

  // Width ratios for the three layers
  const midRatio = 1.44;
  const innerRatio = 0.5;

  const subdivisions = 3;

  function buildOutline(widthRatio: number, circleRadius: number, useSemicircle: boolean): number[] {
    // Generate left and right offset curves
    const leftSide = generateOffsetSide(spine, maxWidth, widthRatio, 1, subdivisions);
    const rightSide = generateOffsetSide(spine, maxWidth, widthRatio, -1, subdivisions);

    // Generate end cap at the basket end (last point)
    const lastPoint = spine[spine.length - 1];
    const lastNormal = getNormal(spine, spine.length - 1);
    const endCap = useSemicircle
      ? generateEndSemicircle(lastPoint, lastNormal, circleRadius, 16)
      : generateEndCircle(lastPoint, circleRadius, 20);

    // Build closed polygon: right side forward -> circle at end -> left side reversed
    const outline: number[] = [];

    // Right side (forward along spine)
    for (const p of rightSide) {
      outline.push(p.x, p.y);
    }

    // Full circle at basket end
    for (const p of endCap) {
      outline.push(p.x, p.y);
    }

    // Left side (reversed, back toward tee)
    for (let i = leftSide.length - 1; i >= 0; i--) {
      outline.push(leftSide[i].x, leftSide[i].y);
    }

    return outline;
  }

  const innerCircleRadius = maxWidth * innerRatio * 1.5;
  const midCircleRadius = maxWidth * midRatio;

  return {
    outer: [],
    mid: buildOutline(midRatio, midCircleRadius, true),
    inner: buildOutline(innerRatio, innerCircleRadius, false),
  };
}

/**
 * Generate a smooth bezier-interpolated spine from the user's control points.
 * This subdivides the input points to create a smoother spine before offset generation.
 */
export function smoothSpine(spineFlat: number[], segments: number = 4): number[] {
  const spine = toPoints(spineFlat);
  if (spine.length < 3) return spineFlat;

  const result: number[] = [];

  // Use Catmull-Rom interpolation between points
  for (let i = 0; i < spine.length - 1; i++) {
    const p0 = spine[Math.max(0, i - 1)];
    const p1 = spine[i];
    const p2 = spine[i + 1];
    const p3 = spine[Math.min(spine.length - 1, i + 2)];

    for (let s = 0; s < segments; s++) {
      const t = s / segments;
      const t2 = t * t;
      const t3 = t2 * t;

      // Catmull-Rom spline formula
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );

      result.push(x, y);
    }
  }

  // Add the last point
  const last = spine[spine.length - 1];
  result.push(last.x, last.y);

  return result;
}
