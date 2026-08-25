/**
 * Disc Golf Asset Library
 *
 * Art style reference: ADGC (Auckland Disc Golf Club) caddy book.
 * Key visual characteristics:
 * - Hatched light green background (diagonal lines) for rough/park areas
 * - Multi-tone green fairway shapes with inner gradient "landing zone"
 * - Trees: small 3-leaf trefoil (scattered) or scalloped bubbly clusters (dense)
 * - Buildings: mauve/grey flat polygons with darker stroke
 * - Water: teal/blue organic shapes
 * - Tee pads: dashed brown rectangles
 * - Paths/fences: brown dashed lines
 */

// === TYPE DEFINITIONS ===

export type AssetCategory =
  | "targets"
  | "tee"
  | "markers"
  | "nature"
  | "terrain"
  | "structures"
  | "misc";

/**
 * A single visual path within a compound asset.
 * Each sub-path has its own fill, stroke, and optional dash pattern.
 */
export interface AssetSubPath {
  /** SVG path data string */
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  /** Optional dash pattern [dash, gap] */
  dash?: number[];
  /** Opacity for this sub-path (0-1) */
  opacity?: number;
}

/**
 * An asset that can contain multiple overlapping paths (compound shape).
 * This allows tree clusters, buildings with rooflines, fairways with
 * inner gradient zones, etc.
 */
export interface AssetDefinition {
  id: string;
  name: string;
  category: AssetCategory;
  /** Viewbox width (coordinate space, not rendered size) */
  width: number;
  /** Viewbox height (coordinate space, not rendered size) */
  height: number;
  /**
   * For simple single-path assets (backward compat).
   * If `paths` is defined, this is ignored.
   */
  svgPath?: string;
  defaultFill?: string;
  defaultStroke?: string;
  defaultStrokeWidth?: number;
  /**
   * Compound asset: multiple sub-paths rendered back-to-front.
   * First path in array is rendered first (bottom layer).
   */
  paths?: AssetSubPath[];
  /** If true, the asset fill responds to the user colour picker */
  userColorable?: boolean;
}

export const ASSET_CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: "targets", label: "Targets" },
  { id: "tee", label: "Tee" },
  { id: "markers", label: "Markers" },
  { id: "nature", label: "Nature" },
  { id: "terrain", label: "Terrain" },
  { id: "structures", label: "Structures" },
  { id: "misc", label: "Misc" },
];

// === COLOUR PALETTE (ADGC caddy book reference) ===

const C = {
  // Greens
  fairwayDark: "#5a7a2e",
  fairwayMid: "#7a9a3e",
  fairwayLight: "#a4c46a",
  fairwayLighter: "#c8e4a0",
  roughBg: "#b8d88a",
  treeDark: "#2d4a1a",
  treeMid: "#3d6424",
  treeLight: "#5a8a3a",
  treeLighter: "#7aaa4e",
  bushDark: "#2d4a1a",

  // Water
  waterFill: "#4a90a4",
  waterStroke: "#2e7088",
  streamFill: "#4a90a4",

  // Structures
  buildingFill: "#b8a0b0",
  buildingStroke: "#7a5a6a",

  // Terrain
  pathBrown: "#6b4e2e",
  teePadBrown: "#5a3e1e",

  // Markers
  obRed: "#cc2222",
  mandoRed: "#cc2222",
} as const;

// === ASSET DEFINITIONS ===

export const DISC_GOLF_ASSETS: AssetDefinition[] = [
  // ============================================================
  // TARGETS
  // ============================================================

  // Basket: single clean outline, two stacked shield shapes connected.
  // Top = chain cage (wider shield with notch at top).
  // Bottom = basket tray (narrower, tapers to stem).
  // Single continuous path with smooth curves, filled solid with stroke.

  {
    id: "basket-red",
    name: "Basket (Red)",
    category: "targets",
    width: 17,
    height: 29,
    paths: [
      {
        d: "M8.8 28.38H7.22C7.22 26.63 7.32 25.33 6.66 24.65C6 23.97 3.86 22.94 2.57 21.46C0.38 18.93 0.49 16.87 0.49 15.29H4.75C3.35 13.9 2.09 12.02 1.3 10.14C0.59 8.48 0.52 4.66 0.42 2.82L5.52 2.36V0.4H11.84V2.36L16.94 2.82C16.84 4.66 16.77 8.48 16.06 10.14C15.27 12.02 14.01 13.9 12.61 15.29H16.87C16.87 16.87 16.98 18.93 14.79 21.46C13.5 22.94 11.36 23.97 10.7 24.65C10.04 25.33 10.14 26.63 10.14 28.38Z",
        fill: "#cc2222",
        stroke: "#2a2a2a",
        strokeWidth: 0.8,
      },
    ],
    userColorable: true,
  },

  {
    id: "basket-blue",
    name: "Basket (Blue)",
    category: "targets",
    width: 17,
    height: 29,
    paths: [
      {
        d: "M8.8 28.38H7.22C7.22 26.63 7.32 25.33 6.66 24.65C6 23.97 3.86 22.94 2.57 21.46C0.38 18.93 0.49 16.87 0.49 15.29H4.75C3.35 13.9 2.09 12.02 1.3 10.14C0.59 8.48 0.52 4.66 0.42 2.82L5.52 2.36V0.4H11.84V2.36L16.94 2.82C16.84 4.66 16.77 8.48 16.06 10.14C15.27 12.02 14.01 13.9 12.61 15.29H16.87C16.87 16.87 16.98 18.93 14.79 21.46C13.5 22.94 11.36 23.97 10.7 24.65C10.04 25.33 10.14 26.63 10.14 28.38Z",
        fill: "#2255aa",
        stroke: "#2a2a2a",
        strokeWidth: 0.8,
      },
    ],
    userColorable: true,
  },

  {
    id: "basket-white",
    name: "Basket (White)",
    category: "targets",
    width: 17,
    height: 29,
    paths: [
      {
        d: "M8.8 28.38H7.22C7.22 26.63 7.32 25.33 6.66 24.65C6 23.97 3.86 22.94 2.57 21.46C0.38 18.93 0.49 16.87 0.49 15.29H4.75C3.35 13.9 2.09 12.02 1.3 10.14C0.59 8.48 0.52 4.66 0.42 2.82L5.52 2.36V0.4H11.84V2.36L16.94 2.82C16.84 4.66 16.77 8.48 16.06 10.14C15.27 12.02 14.01 13.9 12.61 15.29H16.87C16.87 16.87 16.98 18.93 14.79 21.46C13.5 22.94 11.36 23.97 10.7 24.65C10.04 25.33 10.14 26.63 10.14 28.38Z",
        fill: "#ffffff",
        stroke: "#2a2a2a",
        strokeWidth: 0.8,
      },
    ],
    userColorable: true,
  },

  {
    id: "basket-yellow",
    name: "Basket (Yellow)",
    category: "targets",
    width: 17,
    height: 29,
    paths: [
      {
        d: "M8.8 28.38H7.22C7.22 26.63 7.32 25.33 6.66 24.65C6 23.97 3.86 22.94 2.57 21.46C0.38 18.93 0.49 16.87 0.49 15.29H4.75C3.35 13.9 2.09 12.02 1.3 10.14C0.59 8.48 0.52 4.66 0.42 2.82L5.52 2.36V0.4H11.84V2.36L16.94 2.82C16.84 4.66 16.77 8.48 16.06 10.14C15.27 12.02 14.01 13.9 12.61 15.29H16.87C16.87 16.87 16.98 18.93 14.79 21.46C13.5 22.94 11.36 23.97 10.7 24.65C10.04 25.33 10.14 26.63 10.14 28.38Z",
        fill: "#e8b800",
        stroke: "#2a2a2a",
        strokeWidth: 0.8,
      },
    ],
    userColorable: true,
  },

  // ============================================================
  // TEE
  // ============================================================

  {
    id: "tee-pad",
    name: "Tee Pad",
    category: "tee",
    width: 18,
    height: 35,
    paths: [
      // Solid brown rectangle (portrait)
      {
        d: "M 1 1 L 17 1 L 17 34 L 1 34 Z",
        fill: "#6b3320",
        stroke: "#4a2010",
        strokeWidth: 1,
      },
      // Letter "T" - top bar
      {
        d: "M 4 11 L 14 11",
        fill: "none",
        stroke: "#ffffff",
        strokeWidth: 2.5,
      },
      // Letter "T" - vertical stem
      {
        d: "M 9 11 L 9 24",
        fill: "none",
        stroke: "#ffffff",
        strokeWidth: 2.5,
      },
    ],
  },

  {
    id: "marker",
    name: "Marker",
    category: "misc",
    width: 24,
    height: 24,
    svgPath: "M 12 2 L 22 12 L 12 22 L 2 12 Z",
    defaultFill: "#ffffff",
    defaultStroke: "#1f2937",
    defaultStrokeWidth: 2.5,
  },

  // ============================================================
  // MARKERS
  // ============================================================

  {
    id: "mando-left",
    name: "Mando Left",
    category: "markers",
    width: 24,
    height: 24,
    paths: [
      // Post on right side
      {
        d: "M 20 2 L 20 22",
        fill: "none",
        stroke: C.mandoRed,
        strokeWidth: 2.5,
      },
      // Solid triangle pointing left
      {
        d: "M 3 12 L 19 4 L 19 20 Z",
        fill: C.mandoRed,
        stroke: "#7f1d1d",
        strokeWidth: 0.5,
      },
    ],
  },

  {
    id: "mando-right",
    name: "Mando Right",
    category: "markers",
    width: 24,
    height: 24,
    paths: [
      // Post on left side
      {
        d: "M 4 2 L 4 22",
        fill: "none",
        stroke: C.mandoRed,
        strokeWidth: 2.5,
      },
      // Solid triangle pointing right
      {
        d: "M 21 12 L 5 4 L 5 20 Z",
        fill: C.mandoRed,
        stroke: "#7f1d1d",
        strokeWidth: 0.5,
      },
    ],
  },

  {
    id: "ob-stake",
    name: "OB Stake",
    category: "markers",
    width: 24,
    height: 24,
    svgPath: "M 12 2 A 10 10 0 1 0 12 22 A 10 10 0 1 0 12 2 Z",
    defaultFill: C.obRed,
    defaultStroke: "#7f1d1d",
    defaultStrokeWidth: 2,
  },

  {
    id: "drop-zone",
    name: "Drop Zone",
    category: "markers",
    width: 24,
    height: 24,
    paths: [
      // Dashed circle
      {
        d: "M 12 2 A 10 10 0 1 0 12 22 A 10 10 0 1 0 12 2 Z",
        fill: "rgba(37, 99, 235, 0.12)",
        stroke: "#2563eb",
        strokeWidth: 2,
        dash: [4, 3],
      },
      // Letter "D"
      {
        d: "M 7.14 8.76 L 7.14 15.24 L 9.17 15.24 C 12 15.24 12 8.76 9.17 8.76 Z",
        fill: "none",
        stroke: "#2563eb",
        strokeWidth: 2.5,
      },
      // Letter "Z"
      {
        d: "M 12.81 8.76 L 17.67 8.76 L 12.81 15.24 L 17.67 15.24",
        fill: "none",
        stroke: "#2563eb",
        strokeWidth: 2.5,
      },
    ],
  },

  // ============================================================
  // NATURE
  // ============================================================

  // --- Trefoil trees (scattered, individual) ---
  // These match the small 3-leaf clover shapes in the caddy book

  {
    id: "tree-trefoil",
    name: "Tree (Trefoil)",
    category: "nature",
    width: 16,
    height: 16,
    paths: [
      // Three-lobed clover shape
      {
        d: "M 8 3 A 3 3 0 1 1 8 5 Z M 3 10 A 3 3 0 1 1 7 8 Z M 13 10 A 3 3 0 1 1 9 8 Z",
        fill: C.treeDark,
        stroke: "none",
        strokeWidth: 0,
      },
    ],
  },

  {
    id: "tree-trefoil-light",
    name: "Tree (Light)",
    category: "nature",
    width: 16,
    height: 16,
    paths: [
      {
        d: "M 8 3 A 3 3 0 1 1 8 5 Z M 3 10 A 3 3 0 1 1 7 8 Z M 13 10 A 3 3 0 1 1 9 8 Z",
        fill: C.treeMid,
        stroke: "none",
        strokeWidth: 0,
      },
    ],
  },

  {
    id: "tree-trefoil-large",
    name: "Tree (Large Trefoil)",
    category: "nature",
    width: 24,
    height: 24,
    paths: [
      {
        d: "M 12 3 A 5 5 0 1 1 12 7 Z M 3 16 A 5 5 0 1 1 10 11 Z M 21 16 A 5 5 0 1 1 14 11 Z",
        fill: C.treeDark,
        stroke: "none",
        strokeWidth: 0,
      },
    ],
  },

  // --- Scalloped tree clusters (dense canopy) ---
  // These match the bubbly/overlapping circle clusters in the caddy book

  {
    id: "tree-cluster-small",
    name: "Tree Cluster (S)",
    category: "nature",
    width: 32,
    height: 28,
    paths: [
      // Back layer (dark)
      {
        d: "M 8 14 A 7 7 0 1 1 8 15 Z M 22 12 A 8 8 0 1 1 22 13 Z",
        fill: C.treeDark,
        stroke: "none",
        strokeWidth: 0,
      },
      // Mid layer
      {
        d: "M 14 10 A 6 6 0 1 1 14 11 Z M 26 16 A 5 5 0 1 1 26 17 Z",
        fill: C.treeMid,
        stroke: "none",
        strokeWidth: 0,
      },
      // Front highlights
      {
        d: "M 18 14 A 4 4 0 1 1 18 15 Z",
        fill: C.treeLight,
        stroke: "none",
        strokeWidth: 0,
      },
    ],
  },

  {
    id: "tree-cluster-medium",
    name: "Tree Cluster (M)",
    category: "nature",
    width: 48,
    height: 36,
    paths: [
      // Large back blobs
      {
        d: "M 10 18 A 9 9 0 1 1 10 19 Z M 30 14 A 10 10 0 1 1 30 15 Z M 42 22 A 7 7 0 1 1 42 23 Z",
        fill: C.treeDark,
        stroke: "none",
        strokeWidth: 0,
      },
      // Mid blobs
      {
        d: "M 18 14 A 8 8 0 1 1 18 15 Z M 36 18 A 7 7 0 1 1 36 19 Z M 8 24 A 6 6 0 1 1 8 25 Z",
        fill: C.treeMid,
        stroke: "none",
        strokeWidth: 0,
      },
      // Light accents
      {
        d: "M 24 16 A 5 5 0 1 1 24 17 Z M 40 20 A 4 4 0 1 1 40 21 Z",
        fill: C.treeLight,
        stroke: "none",
        strokeWidth: 0,
      },
      // Highlight spots
      {
        d: "M 14 20 A 3 3 0 1 1 14 21 Z M 34 16 A 3 3 0 1 1 34 17 Z",
        fill: C.treeLighter,
        stroke: "none",
        strokeWidth: 0,
        opacity: 0.7,
      },
    ],
  },

  {
    id: "tree-cluster-large",
    name: "Tree Cluster (L)",
    category: "nature",
    width: 64,
    height: 44,
    paths: [
      // Bottom layer: large dark canopy masses
      {
        d: "M 12 22 A 11 11 0 1 1 12 23 Z M 34 18 A 12 12 0 1 1 34 19 Z M 54 24 A 9 9 0 1 1 54 25 Z M 24 32 A 8 8 0 1 1 24 33 Z",
        fill: C.treeDark,
        stroke: "none",
        strokeWidth: 0,
      },
      // Middle layer
      {
        d: "M 20 16 A 9 9 0 1 1 20 17 Z M 44 20 A 10 10 0 1 1 44 21 Z M 8 28 A 7 7 0 1 1 8 29 Z M 56 18 A 6 6 0 1 1 56 19 Z",
        fill: C.treeMid,
        stroke: "none",
        strokeWidth: 0,
      },
      // Light layer
      {
        d: "M 28 20 A 7 7 0 1 1 28 21 Z M 48 16 A 6 6 0 1 1 48 17 Z M 16 26 A 5 5 0 1 1 16 27 Z",
        fill: C.treeLight,
        stroke: "none",
        strokeWidth: 0,
      },
      // Highlight accents
      {
        d: "M 38 22 A 4 4 0 1 1 38 23 Z M 22 18 A 3 3 0 1 1 22 19 Z M 52 22 A 3 3 0 1 1 52 23 Z",
        fill: C.treeLighter,
        stroke: "none",
        strokeWidth: 0,
        opacity: 0.6,
      },
    ],
  },

  // --- Hedgerow/tree line ---

  {
    id: "hedgerow",
    name: "Hedgerow",
    category: "nature",
    width: 64,
    height: 14,
    paths: [
      // Linear chain of scalloped circles
      {
        d: "M 5 7 A 4 4 0 1 1 5 8 Z M 13 6 A 5 5 0 1 1 13 7 Z M 22 7 A 4 4 0 1 1 22 8 Z M 30 5 A 5 5 0 1 1 30 6 Z M 39 7 A 4 4 0 1 1 39 8 Z M 47 6 A 5 5 0 1 1 47 7 Z M 56 7 A 4 4 0 1 1 56 8 Z",
        fill: C.treeDark,
        stroke: "none",
        strokeWidth: 0,
      },
      // Lighter accents on top
      {
        d: "M 9 6 A 3 3 0 1 1 9 7 Z M 25 5 A 3 3 0 1 1 25 6 Z M 43 6 A 3 3 0 1 1 43 7 Z M 59 5 A 3 3 0 1 1 59 6 Z",
        fill: C.treeMid,
        stroke: "none",
        strokeWidth: 0,
      },
    ],
  },

  // --- Bush (spiky star shape from caddy book) ---

  {
    id: "bush-spiky",
    name: "Bush (Spiky)",
    category: "nature",
    width: 20,
    height: 20,
    paths: [
      {
        d: "M 10 1 L 12 6 L 18 4 L 15 9 L 20 10 L 15 12 L 18 17 L 12 14 L 10 19 L 8 14 L 2 17 L 5 12 L 0 10 L 5 8 L 2 4 L 8 6 Z",
        fill: C.bushDark,
        stroke: "none",
        strokeWidth: 0,
      },
    ],
  },

  {
    id: "bush-round",
    name: "Bush (Round)",
    category: "nature",
    width: 14,
    height: 14,
    paths: [
      {
        d: "M 7 2 A 5 5 0 1 1 7 12 A 5 5 0 1 1 7 2 Z",
        fill: C.treeMid,
        stroke: C.treeDark,
        strokeWidth: 1,
      },
    ],
  },

  // ============================================================
  // TERRAIN
  // ============================================================

  {
    id: "water-body",
    name: "Water Body",
    category: "terrain",
    width: 48,
    height: 32,
    paths: [
      {
        d: "M 24 2 C 38 2 46 10 46 16 C 46 24 38 30 24 30 C 10 30 2 24 2 16 C 2 10 10 2 24 2 Z",
        fill: C.waterFill,
        stroke: C.waterStroke,
        strokeWidth: 1.5,
        opacity: 0.85,
      },
    ],
  },

  {
    id: "pond",
    name: "Pond",
    category: "terrain",
    width: 36,
    height: 28,
    paths: [
      {
        d: "M 18 2 C 30 2 34 8 34 14 C 34 22 28 26 18 26 C 8 26 2 22 2 14 C 2 8 6 2 18 2 Z",
        fill: C.waterFill,
        stroke: C.waterStroke,
        strokeWidth: 2,
        opacity: 0.9,
      },
    ],
  },

  {
    id: "path-trail",
    name: "Path/Trail",
    category: "terrain",
    width: 60,
    height: 8,
    paths: [
      {
        d: "M 0 4 L 60 4",
        fill: "none",
        stroke: C.pathBrown,
        strokeWidth: 2.5,
        dash: [6, 4],
      },
    ],
  },

  {
    id: "hill-contour",
    name: "Hill Contour",
    category: "terrain",
    width: 36,
    height: 24,
    paths: [
      {
        d: "M 2 22 C 10 6 26 6 34 22",
        fill: "none",
        stroke: "#78716c",
        strokeWidth: 1.2,
      },
      {
        d: "M 6 22 C 12 12 24 12 30 22",
        fill: "none",
        stroke: "#78716c",
        strokeWidth: 1,
      },
      {
        d: "M 10 22 C 14 16 22 16 26 22",
        fill: "none",
        stroke: "#78716c",
        strokeWidth: 0.8,
      },
    ],
  },

  // ============================================================
  // STRUCTURES
  // ============================================================

  {
    id: "building",
    name: "Building",
    category: "structures",
    width: 32,
    height: 24,
    paths: [
      {
        d: "M 1 1 L 31 1 L 31 23 L 1 23 Z",
        fill: C.buildingFill,
        stroke: C.buildingStroke,
        strokeWidth: 1.5,
      },
    ],
  },

  {
    id: "building-l-shape",
    name: "Building (L)",
    category: "structures",
    width: 36,
    height: 32,
    paths: [
      {
        d: "M 2 2 L 20 2 L 20 14 L 34 14 L 34 30 L 2 30 Z",
        fill: C.buildingFill,
        stroke: C.buildingStroke,
        strokeWidth: 1.5,
      },
    ],
  },

  {
    id: "building-t-shape",
    name: "Building (T)",
    category: "structures",
    width: 36,
    height: 32,
    paths: [
      {
        d: "M 2 2 L 34 2 L 34 12 L 24 12 L 24 30 L 12 30 L 12 12 L 2 12 Z",
        fill: C.buildingFill,
        stroke: C.buildingStroke,
        strokeWidth: 1.5,
      },
    ],
  },

  {
    id: "fence",
    name: "Fence",
    category: "structures",
    width: 60,
    height: 8,
    paths: [
      {
        d: "M 0 4 L 60 4",
        fill: "none",
        stroke: C.pathBrown,
        strokeWidth: 1.5,
        dash: [3, 3],
      },
    ],
  },

  {
    id: "road",
    name: "Road",
    category: "structures",
    width: 60,
    height: 12,
    paths: [
      {
        d: "M 0 1 L 60 1 L 60 11 L 0 11 Z",
        fill: "#d4d4d4",
        stroke: "#737373",
        strokeWidth: 1,
      },
      {
        d: "M 0 6 L 60 6",
        fill: "none",
        stroke: "#ffffff",
        strokeWidth: 1,
        dash: [4, 6],
      },
    ],
  },

  {
    id: "parking",
    name: "Parking",
    category: "structures",
    width: 24,
    height: 24,
    paths: [
      {
        d: "M 2 2 L 22 2 L 22 22 L 2 22 Z",
        fill: "#e5e7eb",
        stroke: "#6b7280",
        strokeWidth: 1.5,
      },
      {
        d: "M 8 7 L 8 17 M 8 7 L 14 7 A 3 3 0 0 1 14 13 L 8 13",
        fill: "none",
        stroke: "#1d4ed8",
        strokeWidth: 2,
      },
    ],
  },
];

// === UTILITY FUNCTIONS ===

export function getAssetsByCategory(category: AssetCategory): AssetDefinition[] {
  return DISC_GOLF_ASSETS.filter((a) => a.category === category);
}

export function getAssetById(id: string): AssetDefinition | undefined {
  return DISC_GOLF_ASSETS.find((a) => a.id === id);
}

/**
 * Returns the primary SVG path for an asset.
 * For compound assets, returns the first path's data.
 * For legacy single-path assets, returns svgPath.
 */
export function getAssetPrimaryPath(asset: AssetDefinition): string {
  if (asset.paths && asset.paths.length > 0) {
    return asset.paths[0].d;
  }
  return asset.svgPath ?? "";
}

/**
 * Check if an asset uses compound paths (multi-path rendering).
 */
export function isCompoundAsset(asset: AssetDefinition): boolean {
  return Array.isArray(asset.paths) && asset.paths.length > 0;
}
