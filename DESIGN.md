# Caddy Book Project Model — Design Document

## Overview

The hole designer evolves from a single-canvas drawing tool into a full caddy book production tool. A project represents a single disc golf course at a specific event, containing multiple holes, layout variants, a course map, and sponsor templates. The output is a set of composed hole pages ready for assembly into a printed caddy book.

## Core Concepts

### Project

The top-level container. One project per event/course combination.

- **Course name** — the physical course (e.g. "Woodhill")
- **Event name** — the tournament (e.g. "Auckland Champs 2025")
- **Date** — event date
- **Layouts** — division/configuration variants
- **Holes** — the physical holes on the course
- **Sponsor template** — reusable page frame applied to every hole page
- **Course map** — overview map canvas

### Layout

A named division or course configuration. Same physical holes, different tee positions, distances, OB rules, or visual emphasis.

Examples:
- "Gold" (MPO/FPO), "Red" (MA1/FA1), "Blue" (MA2/Juniors)
- "Saturday" vs "Sunday" (different pin positions)

Properties:
- `id` — unique identifier
- `name` — display name
- `colour` — hex colour used for course map arrows and tee markers
- `order` — sort position for export ordering

### Hole

A physical hole on the course. Hole numbering is consistent across all layouts (hole 4 is always hole 4).

Properties:
- `id` — unique identifier
- `number` — physical hole number
- `name` — optional nickname (e.g. "The Gauntlet")
- `designs[]` — one design per layout that uses this hole

### Hole Design

The actual graphic and metadata for a specific hole + layout combination. This is where all the creative work happens.

Properties:
- `id` — unique identifier
- `layoutId` — which layout this design belongs to
- `canvas` — shapes array + backgroundColor (the drawing)
- `par` — par for this layout's tee
- `distance` — distance in metres
- `obRules` — free text describing OB boundaries
- `mandoNotes` — free text describing mandatory lines
- `notes` — additional notes (elevation, wind, tips)

### Sponsor Template

Set once per project, applied automatically to every hole page on export.

Components:
- **Top bar** — fixed-height canvas strip (e.g. 800 x 60px). Composed with the same drawing tools (logos, text, shapes).
- **Bottom bar** — fixed-height canvas strip. Same approach.
- **Info banner** — a template layout with placeholder tokens that get substituted per hole:
  - `{{hole}}` — hole number
  - `{{par}}` — par value
  - `{{distance}}` — distance in metres
  - `{{ob}}` — OB rules text
  - `{{mando}}` — mando notes text
  - `{{name}}` — hole nickname

### Course Map

A dedicated canvas for the course overview, using the same drawing tools but with a satellite/terrain image background.

Properties:
- `backgroundImage` — rasterised map tile snapshot
  - `tileSource` — "osm" or "satellite"
  - `bounds` — geographic bounding box
  - `zoom` — tile zoom level
  - `imageData` — stored raster (base64 or file reference)
- `shapes[]` — overlay drawings (arrows, markers, labels)
- Legend entries auto-derived from layout colours and names

## Data Model (TypeScript)

```typescript
interface Project {
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

interface Layout {
  id: string;
  name: string;
  colour: string;
  order: number;
}

interface Hole {
  id: string;
  number: number;
  name: string;
  designs: HoleDesign[];
}

interface HoleDesign {
  id: string;
  layoutId: string;
  canvas: CanvasData;
  par: number;
  distance: number;
  obRules: string;
  mandoNotes: string;
  notes: string;
}

interface CanvasData {
  shapes: Shape[];
  backgroundColor: string;
}

interface SponsorTemplate {
  topBar: CanvasData;
  bottomBar: CanvasData;
  infoBanner: InfoBannerTemplate;
}

interface InfoBannerTemplate {
  canvas: CanvasData; // Contains text shapes with {{token}} placeholders
  height: number;
}

interface CourseMapData {
  backgroundImage: MapBackground | null;
  canvas: CanvasData;
}

interface MapBackground {
  tileSource: "osm" | "satellite";
  bounds: { north: number; south: number; east: number; west: number };
  zoom: number;
  imageData: string; // base64 encoded raster or file path
}
```

## UI Navigation

```
Project Home
├── Project Settings
│   ├── Name, course, event, date
│   ├── Layouts (add/remove/reorder/set colours)
│   └── Sponsor Template Editor
│       ├── Top bar canvas (mini editor)
│       ├── Bottom bar canvas (mini editor)
│       └── Info banner template (mini editor with token insertion)
├── Course Map
│   └── Full editor with satellite background + overlay drawing
└── Holes Grid
    ├── Hole 1 [card with thumbnails per layout]
    │   ├── [Gold] → canvas editor
    │   └── [Red] → canvas editor
    ├── Hole 2
    │   ├── [Gold] → canvas editor
    │   └── [Red] → canvas editor
    └── ... (up to 18/27 holes)
```

### Holes Grid

- Cards arranged in a grid, one per hole
- Each card shows: hole number, name, thumbnail previews per layout
- Layout badges/tabs colour-coded to layout colour
- Click a layout badge to open the editor for that hole+layout design
- Empty designs show a "Create" button
- Bulk actions: "Create all designs for [layout]" (creates blank canvases)

### Hole Editor

The existing canvas editor, contextualised:
- Header shows: Hole # / Layout name / Hole nickname
- Side panel includes metadata fields (par, distance, OB, mando, notes)
- Canvas area is the drawing workspace
- Preview mode shows the composed page (canvas + sponsor bars + info banner)
- Navigation: prev/next hole within the same layout

### Sponsor Template Editor

Three mini-canvases with fixed dimensions:
- Top bar: full page width x configurable height
- Bottom bar: full page width x configurable height
- Info banner: full page width x configurable height, with a "Insert Token" button that places `{{token}}` text shapes

## Export Specification

### Single Hole Export

Output: PNG or SVG

Composed page structure:
```
┌─────────────────────────────┐
│  Sponsor Top Bar            │
├─────────────────────────────┤
│                             │
│   Hole Graphic Canvas       │
│                             │
├─────────────────────────────┤
│  Info Banner                │
│  (tokens replaced with      │
│   hole-specific values)     │
├─────────────────────────────┤
│  Sponsor Bottom Bar         │
└─────────────────────────────┘
```

Dimensions: Configurable page size (default A5 portrait: 148mm x 210mm at 300 DPI = 1748 x 2480px).

### Batch Export (Layout)

Output: PDF

- One page per hole, ordered by hole number
- Each page is the composed hole SVG rendered as a PDF page
- All pages same dimensions
- Vector output (SVG-based rendering into PDF for crisp print)

### Course Map Export

Output: PNG or SVG

- Full canvas including satellite background raster + vector overlays
- Legend auto-composed from layout definitions

## Storage

Still local filesystem JSON. Single file per project (they're self-contained).

```
data/projects/{project-id}.json
```

File size will be larger (multiple canvases, stored map raster) but manageable for local use. Map background images stored as base64 within the JSON, or as separate referenced files in a `data/projects/{project-id}/` directory if size becomes a concern.

## Constraints

- Single user per project (local application)
- No real-time collaboration
- No cloud sync
- No authentication
- All data local to the machine running the app
