# Hole Designer — Session Log

## Session: 2026-08-25

### Asset Cleanup

- **Mando Left/Right:** Replaced open chevron + center post with solid filled triangles on offset posts. Triangle apex points in mandatory direction, flat back flush against post.
- **Drop Zone:** Replaced checkmark with path-based "DZ" lettering (outlined D, stroked Z). Scaled letters 81% of original to fit inside the dashed circle.
- **Tee Pad:** Completely redesigned. Now a solid brown portrait rectangle with white "T" letter inside. Single size (18x35 viewbox). Removed the old dashed brown rectangle and "filled" variant.
- **Tee Marker:** Renamed to "Marker", moved to new "Misc" category.
- **OB Stake:** Increased 50% (24x24 viewbox, radius 10, stroke 2).
- **Removed static assets:** OB Line (promoted to drawing tool), Stream (promoted to drawing tool), all Fairway variants (handled by fairway drawing tool), Rough Zone.

### New Drawing Tools

- **OB Line Tool:** Click to place points, Enter to finish, Escape to cancel. Renders as dotted red line (`#dc2626`, dash `[8, 6]`). Draggable edit handles when selected. SVG export as dashed polyline.
- **Stream Tool:** Same point-placement UX. Renders with Catmull-Rom smoothed curves (8 segments). Thick light blue centre (`#7dd3fc`, 16px) with thin dark blue edges (`#1e40af`, 1.5px). SVG export as two stacked polylines.

### Marquee Selection

- Drag on empty canvas in select mode draws a blue dashed selection rectangle.
- On release, all shapes within the rectangle are selected.
- Multi-drag: dragging one selected shape moves all selected shapes by the same delta.
- Multi-delete: Delete/Backspace removes all selected shapes.
- Fixed click-after-mouseup race condition using `marqueeJustFinished` ref.

### Export Quality Improvements

- PNG pixelRatio: 2 → 4 (output 3200x4800 for 800x1200 artboard).
- Curve segments (smoothSpine): 4 → 8 for both canvas renderer and SVG export. In-progress previews still use 4 for responsiveness.
- OB Stake viewbox: 15x15 → 24x24.
- Marker diamond viewbox: 12x12 → 24x24, stroke 1.5 → 2.5.
- DZ letter strokes: 2 → 2.5.

### Project Model Redesign (Full Caddy Book)

Designed and implemented a complete multi-hole caddy book project model across 6 phases.

#### Phase 1: Data Model + Navigation Shell
- New TypeScript interfaces: Project, Layout, Hole, HoleDesign, CanvasData, SponsorTemplate, CourseMapData, MapBackground, InfoBannerTemplate.
- API routes rewritten for hierarchical structure with legacy auto-migration.
- Project home page (`/projects/[id]`) with layout tabs and holes grid.
- Hole editor page (`/projects/[id]/holes/[holeId]/[layoutId]`) with metadata sidebar (par, distance, OB, mando, notes).
- Project settings page (`/projects/[id]/settings`) with layout management.
- Project list (`/`) with creation form.

#### Phase 2: Info Banner + Templates
- BannerEditor component: self-contained mini canvas for composing sponsor bars and info banners.
- Token system: `{{hole}}`, `{{par}}`, `{{distance}}`, `{{ob}}`, `{{mando}}`, `{{name}}` inserted as text shapes, substituted at export time.
- Composed page preview: Preview toggle in hole editor shows full page (top bar + canvas + info banner + bottom bar).

#### Phase 3: Image Upload
- ImageShape type added to canvas store.
- Upload API (`POST /api/projects/[id]/assets`) and serve API (`GET /api/projects/[id]/assets/[filename]`).
- Image upload in BannerEditor (sponsor logos) and main canvas (hole editor).
- SVG export outputs `<image>` elements.

#### Phase 4: Export Pipeline
- `pdf-lib` installed for client-side PDF generation.
- Composed page SVG renderer (full page with all layers at correct offsets).
- Composed page PNG renderer (SVG-to-canvas at 4x).
- Single hole export: "Page PNG" and "Page SVG" buttons in hole editor.
- Batch PDF export: "Export PDF" button on project home, iterates all holes for active layout, renders each at 3x, assembles multi-page PDF with progress indicator.

#### Phase 5: Course Map
- Course map page (`/projects/[id]/course-map`).
- MapCapture component: full-screen Leaflet with satellite tiles, captures visible area as raster background.
- Drawing tools: Select, Arrow (point-placement with Enter to finish), Marker (numbered, colour-coded), Label.
- Layout-aware: arrows/markers drawn in active layout colour.
- Visibility toggles per layout.
- Auto-generated legend from layout definitions.
- PNG export at 3x.

#### Phase 6: Polish
- **Hole navigation:** PageUp/PageDown and Ctrl+Left/Right to switch holes. Auto-save on navigate. Dirty state indicator (orange dot on Save button).
- **Bulk hole creation:** Add 1/9/18 holes in settings. Create blank designs for all holes per layout.
- **Hole reordering:** Drag-and-drop in holes grid with automatic renumbering.
- **Duplicate design:** Copy current hole design to another layout (with overwrite confirmation).
- **Project duplication:** Copy entire project for next year's event (resets date, keeps graphics).
- **Thumbnails:** Inline SVG preview thumbnails in holes grid (renders all shape types at mini scale).
- **Keyboard shortcuts:** Ctrl+E (export composed PNG), Ctrl+Shift+E (batch PDF export).

### New Files Created This Session

| File | Purpose |
|------|---------|
| `DESIGN.md` | Full caddy book project model design document |
| `MIGRATION-PLAN.md` | 6-phase implementation plan |
| `src/types/project.ts` | New project data model interfaces |
| `src/app/page.tsx` | Rewritten as project list |
| `src/app/projects/[id]/page.tsx` | Project home with holes grid |
| `src/app/projects/[id]/settings/page.tsx` | Project settings |
| `src/app/projects/[id]/holes/[holeId]/[layoutId]/page.tsx` | Hole editor |
| `src/app/projects/[id]/course-map/page.tsx` | Course map editor |
| `src/app/api/projects/route.ts` | Rewritten for new structure |
| `src/app/api/projects/[id]/route.ts` | Rewritten with migration |
| `src/app/api/projects/[id]/holes/[holeId]/designs/[designId]/route.ts` | Hole design save |
| `src/app/api/projects/[id]/assets/route.ts` | Image upload |
| `src/app/api/projects/[id]/assets/[filename]/route.ts` | Image serve |
| `src/app/api/projects/[id]/duplicate/route.ts` | Project duplication |
| `src/components/banner/BannerEditor.tsx` | Mini canvas for sponsor bars/info banner |
| `src/components/banner/ComposedPagePreview.tsx` | Full page preview with token substitution |
| `src/components/map/MapCapture.tsx` | Satellite tile rasterisation |
| `src/components/HoleThumbnail.tsx` | Inline SVG thumbnail renderer |
| `src/lib/export/composedPageExport.ts` | Composed page SVG serializer |
| `src/lib/export/composedPagePng.ts` | Composed page PNG renderer |
| `src/lib/export/batchPdfExport.ts` | Multi-page PDF generation |

### Files Modified This Session

| File | Changes |
|------|---------|
| `src/lib/assets/discGolfAssets.ts` | Mando, DZ, tee pad, OB stake, marker redesigns. Removed stream, OB line, fairways, rough assets. Added "misc" category. |
| `src/store/canvasStore.ts` | Added OBLineShape, StreamShape, ImageShape. Added "obline", "stream" to Tool union. |
| `src/components/canvas/Canvas.tsx` | OBLineRenderer, StreamRenderer, ImageRenderer. Marquee selection. Multi-drag. smoothSpine 8 segments. |
| `src/components/toolbar/Toolbar.tsx` | OB Line and Stream tool buttons. |
| `src/components/toolbar/ExportToolbar.tsx` | pixelRatio 4. |
| `src/lib/export/svgSerializer.ts` | OB line, stream, image export cases. smoothSpine 8 segments. |
| `src/lib/fairwayGeometry.ts` | No changes (smoothSpine already supported segments param). |
| `src/hooks/useProject.ts` | Simplified for new data model. |
| `src/hooks/useKeyboardShortcuts.ts` | No changes. |
| `src/components/toolbar/ProjectToolbar.tsx` | Simplified for new hook interface. |
| `src/components/Editor.tsx` | Save handler updated (legacy, unused). |

### Dependencies Added

- `pdf-lib@1.17.1` — client-side PDF generation for batch export

---

## Session: 2026-08-24

### Reference Material

Sourced art style reference from ADGC (Auckland Disc Golf Club) 2025 Auckland Champs caddy book (Google Slides, published to web). Extracted 137 unique images from the slides via the `slides-images-rt` URL pattern in the page's JavaScript data.

**Extracted reference stored at:** `data/caddy-book-ref/`
- `fairway-maps/` — 37 base layer hole map images (terrain, fairway shapes)
- `tree-assets/` — 15 tree overlays (clusters, hedgerows, scattered trefoils, bushes)
- `misc/` — sponsor logos, hole numbers, other elements
- `repeated-icons/` — frequently repeated slide elements (tree canopy blobs)
- `svg-asset/` — clean SVG assets (basket.svg)

**Key finding:** Basket/target icons, tee pads, OB lines, distance markers, and labels are native Google Slides vector shapes, NOT embedded images. They cannot be extracted as image assets from the published slides.

---

### Art Style Characteristics (from ADGC caddy book)

| Element | Style |
|---------|-------|
| Background/rough | Light green with diagonal hatching pattern |
| Fairway (outer) | Medium olive/dark green, organic corridor shape |
| Fairway (inner) | Lighter green gradient within, teardrop tapering from tee to circle at basket |
| Trees (sparse) | Small 3-leaf trefoil/clover shapes, dark green, randomly scattered |
| Trees (dense) | Scalloped bubbly circles, overlapping, mixed dark/medium/light greens |
| Tree lines | Linear clusters of scalloped circles |
| Bushes/scrub | Dark green spiky star shapes |
| Buildings | Grey/mauve flat polygons with darker stroke |
| Water | Teal/blue organic shapes or lines |
| Paths/fences | Brown dashed lines |
| Tee pad | Dashed brown rectangle |
| Basket target | Two-shape silhouette (see below) |

---

### Basket Target Shape

The basket icon is a distinctive two-part silhouette (side profile of a disc golf basket):
- **Top shape (chain cage):** Curved/arched top with a small rectangular notch protruding upward from center. Sides angle inward to a point at the bottom.
- **Bottom shape (tray/catcher):** Flat wide top, sides curve inward (concave) to a narrow pole/stem, which flares into a Y-shape at the base.

**Lesson learned:** AI-generated SVG paths for complex organic shapes are unreliable. After many failed attempts at hand-crafting the basket path, the correct approach was to source/create a proper SVG file (`data/caddy-book-ref/svg-asset/basket.svg`) and use its path data directly. The SVG uses two mirrored half-paths (left + right) joined at the center axis, which were combined into a single closed path to eliminate a visible center seam.

**Scaling:** Original SVG viewbox 217x360, scaled down 12.5x to 17x29 for the asset library. Stroke width scaled proportionally.

---

### Progress

#### Asset Library Rewrite
- Extended `AssetDefinition` to support compound multi-path assets (`paths[]` array with per-path fill, stroke, dash, opacity)
- Rewrote all asset categories to match ADGC caddy book style
- Updated Canvas renderer (`SelectableAsset`) to use `<Group>` with multiple `<Path>` children
- Updated `AssetPreview` in the panel for compound SVG rendering
- Updated SVG export serializer for compound assets
- **Bug fix:** Asset transform/rotate was scaling exponentially. Root cause: `handleTransformEnd` wasn't accounting for the base rendering scale (`width/viewboxWidth`). Fixed by dividing out the base scale to isolate user transform delta.

#### UI Scaling
- All toolbar icons: `h-4 w-4` → `h-5 w-5`
- All toolbar buttons: `h-8 w-8` → `h-10 w-10`
- Asset panel: `w-56` → `w-72`, previews `h-10 w-10` → `h-14 w-14`
- Asset labels: `text-[10px]` → `text-xs`
- Category tabs: `text-xs` → `text-sm`
- Placed asset size: 1x → 2x viewbox dimensions
- Top bar padding/gaps increased

#### Canvas Background
- Added `backgroundColor` state to the store with colour picker ("BG" in toolbar)
- Separated artboard shadow from fill to fix compositing issues (shadow on a separate rect)
- Replaced rgba preset colours with solid hex pastels to avoid opacity blending issues with the canvas compositing stack

#### Fairway Drawing Tool (new feature)
- New tool type: `"fairway"` with Route icon in toolbar
- New shape type: `FairwayShape` with `spinePoints[]`, `maxWidth`, and fill colours
- **Interaction:** Click to place spine points, Enter to finish, Escape to cancel
- **Geometry generator** (`src/lib/fairwayGeometry.ts`):
  - Catmull-Rom spline interpolation for smooth curves between control points
  - Perpendicular normal offset at each point to create corridor width
  - Power curve taper (`t^0.6`) from narrow at tee to wide at basket
  - Full circle end cap on inner layer, semicircle on outer layer
  - Two rendered layers: outer (dark green, 1.44x width) and inner (lighter green, 0.5x width)
- **Drawing mode:** Locked state — cannot accidentally select other shapes while drawing
- **Warning overlay:** Shows instruction text while drawing mode is active
- **Post-placement editing:** When selected, shows draggable white circle handles on each spine point. Drag handles to reshape the fairway in real-time.
- **Layer ordering:** Fairways always inserted at the back of the canvas
- **Bug fix:** Handle drag was repositioning the entire shape. Fixed by using `cancelBubble = true` on handle drag events to prevent propagation to the parent Group.

---

### Technical Learnings

1. **Google Slides image extraction:** Published slides serve images via `docs.google.com/slides-images-rt/` URLs embedded in JS data. Element IDs map to URLs. Native shapes (text, lines, basic shapes) are NOT extractable as images.

2. **Konva compound assets:** Rendering multiple paths in a single selectable/transformable unit requires a `<Group>` wrapper. The Group handles selection/transform, children handle individual path rendering.

3. **Konva transform scaling bug:** When a Group already has `scaleX/Y` for rendering purposes (viewbox scaling), `onTransformEnd` reports the *total* scale including the base. Must divide out the base rendering scale to get the user's actual resize intent.

4. **Konva handle drag in Groups:** Draggable child nodes within a Group will bubble drag events to the parent. Use `e.cancelBubble = true` on all drag events (start, move, end) to prevent the parent Group from moving.

5. **Konva opacity compositing:** Semi-transparent fills on a canvas composite against whatever is behind them in the HTML DOM (not just within Konva's layer stack). The stage's canvas element has a transparent background by default. CSS background on the container or solid backing rects are needed for predictable blending.

6. **SVG path precision:** AI cannot reliably hand-craft SVG paths for complex organic shapes by description alone. Always use reference SVG files or vector tools for precise shapes. Scale paths mathematically (regex number replacement) rather than redrawing.

---

### Files Modified This Session

| File | Changes |
|------|---------|
| `src/lib/assets/discGolfAssets.ts` | Complete rewrite — compound multi-path assets, ADGC art style |
| `src/store/canvasStore.ts` | Added `AssetSubPathData`, `FairwayShape`, `backgroundColor`, `addShapeToBack`, `fairway` tool |
| `src/components/canvas/Canvas.tsx` | Group-based asset renderer, fairway tool interaction, fairway renderer with handle editing, background colour, UI scaling |
| `src/components/panels/AssetPanel.tsx` | Compound asset preview, UI scaling |
| `src/components/toolbar/Toolbar.tsx` | Fairway tool button, UI scaling |
| `src/components/toolbar/ActionToolbar.tsx` | UI scaling |
| `src/components/toolbar/ExportToolbar.tsx` | UI scaling, background colour in export |
| `src/components/toolbar/ColourPanel.tsx` | BG colour picker, solid hex presets, white-backed swatches |
| `src/components/toolbar/ProjectToolbar.tsx` | UI scaling |
| `src/components/Editor.tsx` | Compound asset placement, 2x sizing, fairway tool colours |
| `src/lib/fairwayGeometry.ts` | New — spine-to-offset geometry generator |
| `src/lib/export/svgSerializer.ts` | Compound asset export, fairway export, background colour |
