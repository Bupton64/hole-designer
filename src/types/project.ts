import { Shape } from "@/store/canvasStore";

// ============================================================
// CANVAS DATA
// ============================================================

export interface CanvasData {
  shapes: Shape[];
  backgroundColor: string;
}

// ============================================================
// LAYOUTS
// ============================================================

export interface Layout {
  id: string;
  name: string;
  colour: string;
  order: number;
}

// ============================================================
// HOLES & DESIGNS
// ============================================================

export interface HoleDesign {
  id: string;
  layoutId: string;
  canvas: CanvasData;
  par: number;
  distance: number;
  obRules: string;
  mandoNotes: string;
  notes: string;
}

export interface Hole {
  id: string;
  number: number;
  name: string;
  designs: HoleDesign[];
}

// ============================================================
// SPONSOR TEMPLATE
// ============================================================

export interface InfoBannerTemplate {
  canvas: CanvasData;
  height: number;
}

export interface SponsorTemplate {
  topBar: CanvasData;
  topBarHeight: number;
  bottomBar: CanvasData;
  bottomBarHeight: number;
  infoBanner: InfoBannerTemplate;
}

// ============================================================
// COURSE MAP
// ============================================================

export interface MapBackground {
  tileSource: "osm" | "satellite";
  bounds: { north: number; south: number; east: number; west: number };
  zoom: number;
  imageData: string;
}

export interface CourseMapData {
  backgroundImage: MapBackground | null;
  canvas: CanvasData;
}

// ============================================================
// PROJECT
// ============================================================

export interface Project {
  id: string;
  name: string;
  courseName: string;
  eventName: string;
  date: string;
  layouts: Layout[];
  holes: Hole[];
  sponsorTemplate: SponsorTemplate;
  courseMap: CourseMapData;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// PROJECT SUMMARY (for list view)
// ============================================================

export interface ProjectSummary {
  id: string;
  name: string;
  courseName: string;
  eventName: string;
  date: string;
  holeCount: number;
  layoutCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// LEGACY FORMAT (for migration)
// ============================================================

export interface LegacyProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  shapes: Shape[];
}

// ============================================================
// HELPERS
// ============================================================

export function createEmptyCanvas(): CanvasData {
  return { shapes: [], backgroundColor: "#ffffff" };
}

export function createDefaultSponsorTemplate(): SponsorTemplate {
  return {
    topBar: createEmptyCanvas(),
    topBarHeight: 60,
    bottomBar: createEmptyCanvas(),
    bottomBarHeight: 60,
    infoBanner: {
      canvas: createEmptyCanvas(),
      height: 80,
    },
  };
}

export function createDefaultLayout(): Layout {
  return {
    id: `layout-${Date.now()}`,
    name: "Default",
    colour: "#f59e0b",
    order: 0,
  };
}

export function isLegacyProject(data: unknown): data is LegacyProject {
  return (
    typeof data === "object" &&
    data !== null &&
    "shapes" in data &&
    Array.isArray((data as LegacyProject).shapes) &&
    !("holes" in data)
  );
}
