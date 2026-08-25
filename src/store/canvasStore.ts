import { create } from "zustand";

export type Tool = "select" | "pan" | "rectangle" | "ellipse" | "line" | "freehand" | "text" | "fairway" | "obline" | "stream";

export interface ShapeBase {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
}

export interface RectShape extends ShapeBase {
  type: "rectangle";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface EllipseShape extends ShapeBase {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineShape extends ShapeBase {
  type: "line";
  points: number[];
  stroke: string;
  strokeWidth: number;
  closed: boolean;
  fill: string;
}

export interface AssetSubPathData {
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  opacity?: number;
}

export interface AssetShape extends ShapeBase {
  type: "asset";
  assetId: string;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  svgPath: string;
  /** Compound asset: multiple sub-paths rendered back-to-front */
  paths?: AssetSubPathData[];
  /** Viewbox width for scaling compound assets */
  viewboxWidth?: number;
  /** Viewbox height for scaling compound assets */
  viewboxHeight?: number;
}

export interface TextShape extends ShapeBase {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle: "normal" | "bold" | "italic";
}

export interface FairwayShape extends ShapeBase {
  type: "fairway";
  /** Spine points defining the center line of the fairway [x1, y1, x2, y2, ...] */
  spinePoints: number[];
  /** Maximum width of the outer fairway at the basket end */
  maxWidth: number;
  /** Colours for the three nested layers */
  outerFill: string;
  midFill: string;
  innerFill: string;
}

export interface OBLineShape extends ShapeBase {
  type: "obline";
  /** Points defining the OB line [x1, y1, x2, y2, ...] */
  points: number[];
  /** Stroke colour */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Dash pattern [dash, gap] */
  dash: number[];
}

export interface StreamShape extends ShapeBase {
  type: "stream";
  /** Points defining the stream path [x1, y1, x2, y2, ...] */
  points: number[];
  /** Thick centre fill colour (light blue) */
  fillStroke: string;
  /** Centre stroke width */
  fillWidth: number;
  /** Thin edge line colour (dark blue) */
  edgeStroke: string;
  /** Edge stroke width */
  edgeWidth: number;
}

export interface ImageShape extends ShapeBase {
  type: "image";
  /** URL or path to the image (served via /api/projects/[id]/assets/[filename]) */
  src: string;
  width: number;
  height: number;
  /** Original filename for reference */
  filename: string;
}

export type Shape = RectShape | EllipseShape | LineShape | AssetShape | TextShape | FairwayShape | OBLineShape | StreamShape | ImageShape;

const MAX_HISTORY = 50;

export interface CanvasState {
  // Tool
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  // Drawing defaults
  defaultFill: string;
  defaultStroke: string;
  defaultStrokeWidth: number;
  setDefaultFill: (fill: string) => void;
  setDefaultStroke: (stroke: string) => void;
  setDefaultStrokeWidth: (width: number) => void;

  // Grid & snap
  gridSize: number;
  snapEnabled: boolean;
  setGridSize: (size: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
  snapToGrid: (value: number) => number;

  // Canvas background
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;

  // Shapes
  shapes: Shape[];
  setShapes: (shapes: Shape[]) => void;
  addShape: (shape: Shape) => void;
  addShapeToBack: (shape: Shape) => void;
  updateShape: (id: string, updater: (shape: Shape) => Shape) => void;
  removeShape: (id: string) => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;

  // Clipboard
  clipboard: Shape[];
  copySelection: () => void;
  paste: () => void;

  // Layer ordering
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // History
  past: Shape[][];
  future: Shape[][];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function pushHistory(state: CanvasState): { past: Shape[][]; future: Shape[][] } {
  const past = [...state.past, state.shapes];
  if (past.length > MAX_HISTORY) {
    past.shift();
  }
  return { past, future: [] };
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Tool
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Drawing defaults
  defaultFill: "#bfdbfe",
  defaultStroke: "#3b82f6",
  defaultStrokeWidth: 2,
  setDefaultFill: (fill) => set({ defaultFill: fill }),
  setDefaultStroke: (stroke) => set({ defaultStroke: stroke }),
  setDefaultStrokeWidth: (width) => set({ defaultStrokeWidth: width }),

  // Grid & snap
  gridSize: 10,
  snapEnabled: true,
  setGridSize: (size) => set({ gridSize: size }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  snapToGrid: (value) => {
    const { snapEnabled, gridSize } = get();
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  },

  backgroundColor: "#ffffff",
  setBackgroundColor: (color) => set({ backgroundColor: color }),

  // Shapes
  shapes: [],
  setShapes: (shapes) => set({ shapes, past: [], future: [], selectedIds: [] }),
  addShape: (shape) =>
    set((state) => ({
      ...pushHistory(state),
      shapes: [...state.shapes, shape],
    })),
  addShapeToBack: (shape) =>
    set((state) => ({
      ...pushHistory(state),
      shapes: [shape, ...state.shapes],
    })),
  updateShape: (id, updater) =>
    set((state) => ({
      ...pushHistory(state),
      shapes: state.shapes.map((s) => (s.id === id ? updater(s) : s)),
    })),
  removeShape: (id) =>
    set((state) => ({
      ...pushHistory(state),
      shapes: state.shapes.filter((s) => s.id !== id),
    })),

  // Selection
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  // Clipboard
  clipboard: [],
  copySelection: () => {
    const { shapes, selectedIds } = get();
    const copied = shapes.filter((s) => selectedIds.includes(s.id));
    set({ clipboard: copied });
  },
  paste: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;
    const newShapes = clipboard.map((s) => ({
      ...s,
      id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x: s.x + 20,
      y: s.y + 20,
    }));
    const newIds = newShapes.map((s) => s.id);
    set((state) => ({
      ...pushHistory(state),
      shapes: [...state.shapes, ...newShapes],
      selectedIds: newIds,
      clipboard: newShapes,
    }));
  },

  // Layer ordering
  bringForward: (id) =>
    set((state) => {
      const index = state.shapes.findIndex((s) => s.id === id);
      if (index < 0 || index >= state.shapes.length - 1) return state;
      const shapes = [...state.shapes];
      [shapes[index], shapes[index + 1]] = [shapes[index + 1], shapes[index]];
      return { ...pushHistory(state), shapes };
    }),
  sendBackward: (id) =>
    set((state) => {
      const index = state.shapes.findIndex((s) => s.id === id);
      if (index <= 0) return state;
      const shapes = [...state.shapes];
      [shapes[index], shapes[index - 1]] = [shapes[index - 1], shapes[index]];
      return { ...pushHistory(state), shapes };
    }),
  bringToFront: (id) =>
    set((state) => {
      const index = state.shapes.findIndex((s) => s.id === id);
      if (index < 0 || index >= state.shapes.length - 1) return state;
      const shapes = [...state.shapes];
      const [shape] = shapes.splice(index, 1);
      shapes.push(shape);
      return { ...pushHistory(state), shapes };
    }),
  sendToBack: (id) =>
    set((state) => {
      const index = state.shapes.findIndex((s) => s.id === id);
      if (index <= 0) return state;
      const shapes = [...state.shapes];
      const [shape] = shapes.splice(index, 1);
      shapes.unshift(shape);
      return { ...pushHistory(state), shapes };
    }),

  // History
  past: [],
  future: [],
  undo: () => {
    const { past, shapes, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      shapes: previous,
      future: [shapes, ...future],
      selectedIds: [],
    });
  },
  redo: () => {
    const { past, shapes, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, shapes],
      shapes: next,
      future: future.slice(1),
      selectedIds: [],
    });
  },
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
