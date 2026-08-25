# Hole Designer — Project Spec

## Concept

A locally-hosted web application for creating stylised disc golf hole graphics. Built for tournament directors who need quality, consistent hole maps for event materials (caddy books, social media, signage).

Two creation workflows:

1. **Manual drawing** — build a hole graphic from scratch using a canvas editor with disc golf-specific preset assets.
2. **Map-based generation** — select a real-world area from OpenStreetMap, and the app deterministically converts OSM vector data into a stylised hole graphic using the same asset library.

## Target User

Disc golf tournament directors creating hole graphics for events. Single user in v1, collaboration in future versions.

## MVP Features

### Drawing Tool

- Canvas-based editor with layers, pan, zoom, and transform controls
- Preset asset library:
  - Tee pad
  - Basket (target)
  - Fairway shapes (straight, dogleg, S-curve)
  - Rough / out-of-bounds zones
  - Mandatory (mando) markers
  - Trees (individual and cluster)
  - Water hazards
  - Paths / trails
  - Elevation indicators
  - Buildings / structures
  - Text labels and distance markers
- Freeform drawing (paths, polygons, lines)
- Snap-to-grid and alignment guides
- Undo / redo
- Layer management (reorder, visibility, lock)

### Map Import

- Embedded Leaflet map with OSM terrain/satellite tile layers
- User selects a rectangular area on the map
- App queries Overpass API for vector features within the bounding box
- Deterministic mapping of OSM tags to drawing assets:
  - `natural=water` -> water hazard shape
  - `landuse=forest` / `natural=wood` -> tree clusters
  - `highway=path` / `highway=footway` -> trail lines
  - `building=*` -> structure outlines
  - `leisure=pitch` / open areas -> fairway candidates
  - `natural=scrub` -> rough zones
- Generated shapes placed on canvas at correct relative positions
- User refines, adds disc golf-specific elements (tee, basket, mando, OB)

### Export

- PNG (rasterised, configurable resolution)
- PDF (single page, print-ready)
- SVG (vector, premium output — full fidelity)

### Project Management

- Save / load projects as JSON files to local filesystem
- Project = complete canvas state (layers, assets, positions, metadata)
- Recent projects list

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js (App Router) | Full-stack React, file-based routing, API routes |
| Language | TypeScript | Type safety throughout |
| Canvas | Konva.js + react-konva | 2D drawing, layers, transforms, hit detection |
| Map | Leaflet + react-leaflet | OSM integration, tile layers, area selection |
| State | Zustand | Drawing state, undo/redo stack, UI state |
| Export (PNG) | Konva `.toDataURL()` / html2canvas | Raster export |
| Export (PDF) | jsPDF | Wraps rasterised canvas |
| Export (SVG) | Konva `.toSVG()` or custom serialisation | Vector export |
| OSM Data | Overpass API | Query vector features by bounding box |
| Storage | Local filesystem (JSON) | Project persistence via Next.js API routes |
| Package Manager | npm or Bun | TBD based on preference |
| Linting | ESLint + Prettier | Code quality |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js App (locally hosted)                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Pages (App Router)                             │
│  ├── / ...................... Project list       │
│  ├── /editor/[id] .......... Drawing canvas     │
│  └── /import ............... Map selection       │
│                                                 │
│  API Routes (/app/api/)                         │
│  ├── /projects ............. CRUD project files  │
│  ├── /osm .................. Overpass proxy      │
│  └── /export ............... Server-side export  │
│                                                 │
├─────────────────────────────────────────────────┤
│  Client Components ("use client")               │
│  ├── Canvas editor (Konva)                      │
│  ├── Map viewer (Leaflet)                       │
│  ├── Asset palette                              │
│  └── Layer panel                                │
│                                                 │
├─────────────────────────────────────────────────┤
│  State (Zustand)                                │
│  ├── Canvas state (shapes, layers, selection)   │
│  ├── History stack (undo/redo)                  │
│  └── UI state (active tool, panel visibility)   │
│                                                 │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
  Local Filesystem          Overpass API
  (project JSON files)      (OSM vector data)
```

## Map-to-Graphic Pipeline

1. User opens map view, navigates to course location
2. User draws a rectangle selecting the hole area
3. Frontend sends bounding box coordinates to `/api/osm`
4. API route queries Overpass for features within bounds
5. Response parsed: OSM tags matched to asset type mapping table
6. Coordinates transformed from geo (lat/lng) to canvas (px) space
7. Assets instantiated on canvas at mapped positions
8. User takes over: adds tee, basket, OB, mandos, adjusts layout

## OSM Tag Mapping (initial set)

| OSM Tag | Asset |
|---------|-------|
| `natural=water` | Water hazard |
| `landuse=forest` | Tree cluster |
| `natural=wood` | Tree cluster |
| `natural=tree` | Individual tree |
| `natural=scrub` | Rough zone |
| `highway=path` | Trail line |
| `highway=footway` | Trail line |
| `highway=track` | Trail line |
| `building=*` | Structure outline |
| `leisure=park` | Open fairway |
| `landuse=grass` | Open fairway |
| `natural=sand` | Sand/bunker |
| `waterway=stream` | Water line |

## Non-Goals (v1)

- No user accounts or authentication
- No cloud hosting or deployment
- No AI/ML processing
- No real-time collaboration
- No mobile-optimised layout
- No course-level management (single hole per project)

## Future Considerations

- Multi-user collaboration (shared projects, real-time co-editing)
- Course-level projects (collection of holes, caddy book generation)
- Custom asset creation / import
- Template library (common hole shapes)
- Printing presets (A4 caddy book page, social media dimensions)
- PDGA course map format compliance

## Running Locally

```bash
npm install
npm run dev
# App available at http://localhost:3000
```

No external services required beyond internet access for OSM tile loading and Overpass queries.
