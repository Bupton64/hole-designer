# Migration Plan — Single Canvas to Caddy Book Project Model

## Current State

- Project = single JSON file with `{ id, name, shapes[], createdAt, updatedAt }`
- One canvas per project
- No metadata (par, distance, OB)
- No layouts, no multi-hole support
- No course map
- No sponsor/template system
- API routes: basic CRUD on flat project files
- Editor: single canvas view with toolbar + asset panel

## Target State

See `DESIGN.md` for the full specification.

## Phased Approach

Each phase delivers usable functionality. No big-bang migration required.

---

## Phase 1: New Data Model + Project Shell

**Goal:** Replace the flat project model with the new hierarchical structure. Get the navigation shell working. Existing single-canvas editing still works, just nested inside the new structure.

### Tasks

1. **Define new TypeScript interfaces** in `src/types/project.ts`
   - Project, Layout, Hole, HoleDesign, CanvasData, SponsorTemplate, CourseMapData
   - Keep the old `Project` interface temporarily as `LegacyProject` for migration

2. **Update API routes** (`/api/projects`)
   - `POST` creates a project with the new structure (empty holes, one default layout)
   - `GET` returns project summaries (unchanged interface)
   - `GET /[id]` returns the full new project structure
   - `PUT /[id]` accepts partial updates (project settings, individual hole designs)
   - Add `PUT /api/projects/[id]/holes/[holeId]/designs/[designId]` for saving individual canvases

3. **Legacy migration utility**
   - On load, detect old format (has `shapes[]` at root) and auto-migrate:
     - Create a default layout ("Default")
     - Create hole 1 with a single design containing the existing shapes
   - Write back in new format

4. **Project Home page** (`/projects/[id]`)
   - Project header (name, event, course, date)
   - Holes grid (cards with hole number, empty state)
   - Layout tabs/filter
   - "Create Hole" / "Add Layout" actions

5. **Navigation routing**
   - `/` — project list (existing)
   - `/projects/[id]` — project home
   - `/projects/[id]/holes/[holeId]/[layoutId]` — hole editor
   - `/projects/[id]/course-map` — course map editor
   - `/projects/[id]/settings` — project settings + sponsor template

6. **Wire the existing canvas editor** into the new hole route
   - Load shapes from `project.holes[x].designs[y].canvas`
   - Save back to the same path
   - Add metadata sidebar (par, distance, OB, mando, notes)

### Deliverable
Project creation with layouts and holes. Navigate between holes. Edit individual hole canvases with metadata. Old projects auto-migrate.

---

## Phase 2: Hole Metadata + Info Banner

**Goal:** Hole pages show contextual information. Info banner template system works.

### Tasks

1. **Metadata sidebar in hole editor**
   - Par (number input)
   - Distance (number input, metres)
   - OB Rules (textarea)
   - Mando Notes (textarea)
   - Notes (textarea)
   - Auto-save on change (debounced)

2. **Info banner template editor**
   - Accessible from project settings
   - Mini canvas editor (fixed width x configurable height)
   - "Insert Token" dropdown: `{{hole}}`, `{{par}}`, `{{distance}}`, `{{ob}}`, `{{mando}}`, `{{name}}`
   - Tokens placed as Text shapes with the token string as content
   - Preview with sample data substitution

3. **Composed page preview**
   - "Preview" toggle in hole editor
   - Renders: top bar + canvas + info banner (tokens replaced) + bottom bar
   - Read-only composite view at export dimensions
   - Shows what the final exported page will look like

### Deliverable
Hole metadata editable inline. Info banner composed once, previewed per hole with substituted values.

---

## Phase 3: Sponsor Template Editor

**Goal:** Sponsor bars are composable canvases that frame every hole page.

### Tasks

1. **Sponsor template settings page**
   - Two mini canvas editors: top bar, bottom bar
   - Configurable height per bar
   - Same tools as the main editor (assets, shapes, text, images)
   - Fixed width = page width

2. **Image upload support** (needed for sponsor logos)
   - Add image shape type to the canvas store
   - Upload images to project directory (`data/projects/[id]/assets/`)
   - Render as Konva Image nodes
   - Include in SVG export as embedded base64 `<image>` elements

3. **Sponsor bar persistence**
   - Saved as part of `project.sponsorTemplate.topBar` / `.bottomBar`
   - Canvas data (shapes + background)

### Deliverable
Sponsor bars designed in-tool with uploaded logos. Stored per project.

---

## Phase 4: Export Pipeline

**Goal:** Export composed hole pages as PNG/SVG, and batch export as PDF.

### Tasks

1. **Composed page renderer**
   - Programmatically build a full-page Konva stage:
     - Top bar shapes
     - Hole canvas shapes (offset by top bar height)
     - Info banner shapes (tokens replaced, offset below canvas)
     - Bottom bar shapes (offset below banner)
   - Configurable page dimensions (A5 default)

2. **Single hole export**
   - PNG: render composed stage at 4x pixelRatio
   - SVG: serialise all layers into one SVG document with correct offsets

3. **Batch PDF export**
   - Iterate all holes for a selected layout, ordered by hole number
   - Render each as SVG
   - Assemble into multi-page PDF (use a library like `pdf-lib` or `jspdf`)
   - Each page = one hole's composed SVG

4. **Export UI**
   - In hole editor: "Export this hole" (PNG/SVG)
   - In project home: "Export layout" dropdown → select layout → PDF download
   - Progress indicator for batch operations

### Deliverable
Print-ready hole pages. Batch PDF for the full layout. Vector quality throughout.

---

## Phase 5: Course Map

**Goal:** Build a course overview map with satellite background and drawn overlays.

### Tasks

1. **Map background capture**
   - Reuse existing Leaflet integration
   - User navigates to course, selects area
   - "Capture" button rasterises the visible tiles to a canvas/image
   - Store as base64 in project (or external file if large)
   - No stylised conversion, raw satellite/terrain imagery

2. **Course map editor**
   - Same canvas editor, but with the rasterised map as a locked background layer
   - Draw arrows (coloured per layout), tee markers, basket markers, labels
   - Add numbered markers tool (or use existing assets with hole number labels)

3. **Layout-aware drawing**
   - Arrows/markers tagged with layout ID
   - Toggle layout visibility (show/hide layers by layout)
   - Colours auto-applied from layout definitions

4. **Legend generation**
   - Auto-composed from layout definitions (colour swatch + name)
   - Positioned on the map canvas (draggable)

5. **Course map export**
   - PNG or SVG (background raster + vector overlays)
   - Optional: include in batch PDF as first or last page

### Deliverable
Course overview map built entirely in-tool with satellite background.

---

## Phase 6: Polish + Quality of Life

**Goal:** Smooth the workflow for a tournament director building a full caddy book.

### Tasks

1. **Hole navigation within editor**
   - Prev/Next hole buttons (within same layout)
   - Keyboard shortcuts (Page Up/Down)
   - Dirty state indicator + auto-save

2. **Bulk hole creation**
   - "Create 18 holes" button in project setup
   - "Create designs for all holes" per layout

3. **Hole reordering**
   - Drag-and-drop in the holes grid
   - Renumber automatically

4. **Duplicate design**
   - Copy a hole design from one layout to another (as starting point)
   - "Duplicate hole" within same layout (for similar holes)

5. **Project duplication**
   - Copy entire project (for next year's event at same course)
   - Reset event-specific data (date, sponsors) while keeping hole graphics

6. **Thumbnail generation**
   - Auto-generate small preview thumbnails for the holes grid
   - Cached, regenerated on save

7. **Keyboard shortcuts**
   - Ctrl+S saves current hole design
   - Ctrl+E exports current hole
   - Ctrl+Shift+E batch exports layout

### Deliverable
Polished TD workflow. Fast navigation, bulk operations, project reuse.

---

## Implementation Order Rationale

| Phase | Why this order |
|-------|---------------|
| 1 | Foundation. Everything else depends on the data model and navigation. |
| 2 | Metadata makes hole pages useful even without sponsor bars. |
| 3 | Sponsor bars need image upload (new capability), worth isolating. |
| 4 | Export is the payoff. Once pages compose correctly, the tool delivers value. |
| 5 | Course map is additive. The tool is useful without it. |
| 6 | Polish after core functionality works end-to-end. |

## Estimated Scope

- Phase 1: Large (new routing, data model, migration, navigation shell)
- Phase 2: Medium (metadata UI, template editor, preview renderer)
- Phase 3: Medium (image upload is the hard part, rest is canvas reuse)
- Phase 4: Medium (composed renderer + PDF library integration)
- Phase 5: Medium (map capture, layout-aware layers)
- Phase 6: Small-Medium (incremental quality of life additions)

## Dependencies

- **PDF generation:** Need a client-side or server-side PDF library (`pdf-lib` recommended for SVG page insertion)
- **Image upload:** Need file storage strategy (project subdirectory) and a new shape type
- **Map tile rasterisation:** Need to capture Leaflet canvas to image (html2canvas or Leaflet's built-in export)

## Files Affected (Phase 1)

| File | Change |
|------|--------|
| `src/types/project.ts` | New interfaces |
| `src/app/api/projects/route.ts` | New project structure |
| `src/app/api/projects/[id]/route.ts` | Nested updates |
| `src/app/projects/[id]/page.tsx` | New: project home |
| `src/app/projects/[id]/holes/[holeId]/[layoutId]/page.tsx` | New: hole editor route |
| `src/app/projects/[id]/settings/page.tsx` | New: project settings |
| `src/app/projects/[id]/course-map/page.tsx` | New: course map (stub) |
| `src/components/Editor.tsx` | Refactor to accept canvas data as props |
| `src/hooks/useProject.ts` | Rewrite for new data model |
| `src/app/page.tsx` | Project list with creation flow |
