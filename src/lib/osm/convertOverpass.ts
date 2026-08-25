import { Shape, RectShape, EllipseShape, LineShape } from "@/store/canvasStore";
import { ARTBOARD_WIDTH, ARTBOARD_HEIGHT } from "@/components/canvas/Canvas";
import { generateId } from "@/lib/generateId";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

// Map geo coordinates to canvas coordinates
function geoToCanvas(
  lat: number,
  lng: number,
  bbox: BoundingBox
): { x: number; y: number } {
  const xRatio = (lng - bbox.west) / (bbox.east - bbox.west);
  // Y is inverted: north is top (lower y)
  const yRatio = (bbox.north - lat) / (bbox.north - bbox.south);

  return {
    x: xRatio * ARTBOARD_WIDTH,
    y: yRatio * ARTBOARD_HEIGHT,
  };
}

// Classify an element by its tags
type FeatureType = "water" | "forest" | "tree" | "scrub" | "grass" | "path" | "road" | "building" | "fence" | "sand";

function classifyElement(element: OverpassElement): FeatureType | null {
  const tags = element.tags ?? {};

  if (tags.natural === "water" || tags.waterway) return "water";
  if (tags.landuse === "forest" || tags.natural === "wood") return "forest";
  if (tags.natural === "tree") return "tree";
  if (tags.natural === "scrub") return "scrub";
  if (tags.landuse === "grass" || tags.landuse === "meadow" || tags.leisure === "park") return "grass";
  if (tags.highway === "path" || tags.highway === "footway" || tags.highway === "track" || tags.highway === "cycleway") return "path";
  if (tags.highway === "residential" || tags.highway === "service" || tags.highway === "tertiary" || tags.highway === "secondary") return "road";
  if (tags.building) return "building";
  if (tags.barrier === "fence" || tags.barrier === "wall") return "fence";
  if (tags.natural === "sand" || tags.natural === "beach") return "sand";

  return null;
}

// Style definitions for each feature type
const FEATURE_STYLES: Record<FeatureType, { fill: string; stroke: string; strokeWidth: number }> = {
  water: { fill: "rgba(59, 130, 246, 0.35)", stroke: "#1d4ed8", strokeWidth: 1.5 },
  forest: { fill: "rgba(22, 101, 52, 0.4)", stroke: "#14532d", strokeWidth: 1 },
  tree: { fill: "#166534", stroke: "#14532d", strokeWidth: 1 },
  scrub: { fill: "rgba(77, 124, 15, 0.3)", stroke: "#365314", strokeWidth: 0.75 },
  grass: { fill: "rgba(74, 222, 128, 0.2)", stroke: "#16a34a", strokeWidth: 0.75 },
  path: { fill: "none", stroke: "#a16207", strokeWidth: 2 },
  road: { fill: "none", stroke: "#6b7280", strokeWidth: 3 },
  building: { fill: "#e5e7eb", stroke: "#4b5563", strokeWidth: 1.5 },
  fence: { fill: "none", stroke: "#78716c", strokeWidth: 1.5 },
  sand: { fill: "rgba(251, 191, 36, 0.3)", stroke: "#d97706", strokeWidth: 0.75 },
};

function convertNode(element: OverpassElement, featureType: FeatureType, bbox: BoundingBox): Shape | null {
  if (element.lat === undefined || element.lon === undefined) return null;

  const pos = geoToCanvas(element.lat, element.lon, bbox);

  if (featureType === "tree") {
    const shape: EllipseShape = {
      id: generateId(),
      type: "ellipse",
      x: pos.x,
      y: pos.y,
      radiusX: 6,
      radiusY: 6,
      rotation: 0,
      fill: FEATURE_STYLES.tree.fill,
      stroke: FEATURE_STYLES.tree.stroke,
      strokeWidth: FEATURE_STYLES.tree.strokeWidth,
      visible: true,
      locked: false,
    };
    return shape;
  }

  return null;
}

function convertWay(element: OverpassElement, featureType: FeatureType, bbox: BoundingBox): Shape | null {
  const geometry = element.geometry;
  if (!geometry || geometry.length < 2) return null;

  const points = geometry.flatMap((g) => {
    const p = geoToCanvas(g.lat, g.lon, bbox);
    return [p.x, p.y];
  });

  const style = FEATURE_STYLES[featureType];
  const isClosedShape = featureType === "water" || featureType === "forest" || featureType === "building" || featureType === "grass" || featureType === "scrub" || featureType === "sand";

  // For closed polygonal areas, use a closed line shape
  if (isClosedShape) {
    const shape: LineShape = {
      id: generateId(),
      type: "line",
      x: 0,
      y: 0,
      points,
      rotation: 0,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      closed: true,
      fill: style.fill,
      visible: true,
      locked: false,
    };
    return shape;
  }

  // For linear features (paths, roads, fences), use an open line
  const shape: LineShape = {
    id: generateId(),
    type: "line",
    x: 0,
    y: 0,
    points,
    rotation: 0,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    closed: false,
    fill: "none",
    visible: true,
    locked: false,
  };
  return shape;
}

export function convertOverpassToShapes(
  elements: OverpassElement[],
  bbox: BoundingBox
): Shape[] {
  const shapes: Shape[] = [];

  for (const element of elements) {
    const featureType = classifyElement(element);
    if (!featureType) continue;

    let shape: Shape | null = null;

    if (element.type === "node") {
      shape = convertNode(element, featureType, bbox);
    } else if (element.type === "way") {
      shape = convertWay(element, featureType, bbox);
    }

    if (shape) {
      shapes.push(shape);
    }
  }

  // Sort: closed areas first (background), then linear features, then nodes on top
  shapes.sort((a, b) => {
    const aWeight = getLayerWeight(a);
    const bWeight = getLayerWeight(b);
    return aWeight - bWeight;
  });

  return shapes;
}

function getLayerWeight(shape: Shape): number {
  if (shape.type === "line" && shape.closed) return 0; // Areas at bottom
  if (shape.type === "line" && !shape.closed) return 1; // Linear features middle
  if (shape.type === "ellipse") return 2; // Point features on top
  return 1;
}
