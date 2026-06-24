# AGENTS.md

Guidance for AI agents working in this codebase. Read this before making changes.

## Project

Map Generator — a fully client-side React SPA that replicates a QGIS Print Layout workflow: load raster/vector GIS data in a Data Viewer, then design a print-ready layout (map frame, north arrow, scale bar, legend, logos, text) and export to PDF. All processing happens in the browser; there is no backend.

See `README.md` for the user-facing overview and `docs/` for in-depth architecture docs (`ARCHITECTURE.md`, `WORKFLOW_LOAD_DATA.md`, `WORKFLOW_EXPORT_MAP.md`, `STATE_MANAGEMENT.md`, `PROJECTION_AND_REPROJECTION.md`). Consult `docs/README.md` first — it maps common tasks to the files you need to touch.

## Commands

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Dev server (http://localhost:5173) | `npm run dev` |
| Typecheck + production build | `npm run build` (`tsc -b && vite build`) |
| Lint | `npm run lint` (oxlint) |
| Preview prod build | `npm run preview` |

There is no test runner or formatter configured. After any change, run `npm run lint` and `npm run build` to verify — `build` runs `tsc -b`, which is the only typecheck step.

## Environment

- Node.js >= 22, npm >= 10
- ESM (`"type": "module"`)
- TypeScript ~6.0 targeting `es2023`, JSX `react-jsx`
- `verbatimModuleSyntax: true` — **always use `import type` for type-only imports** (e.g. `import type { LayoutElement } from '@/types/layout'`). Mixing values and types in one statement is fine only for the value import; pure type imports must use `import type`.
- `noUnusedLocals` and `noUnusedParameters` are on — remove unused vars/params (or prefix with `_`) before building.
- `erasableSyntaxOnly: true` — do not use TS-only runtime syntax like `enum` or parameter properties; prefer `const` objects/unions and explicit field assignment.

## Path Alias

`@/*` resolves to `./src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`). Prefer `@/...` imports over relative paths for anything outside the current file's folder.

## Code Style (observed)

- 2-space indentation, single quotes, **no semicolons** — match surrounding files.
- Named exports for React components (no default exports except `main.tsx`/pages where the router expects them).
- Tailwind CSS 4 (via `@tailwindcss/vite`) — white/gray utility palette; UI primitives live in `src/components/shared/ui/` (shadcn-style: Button, Input, Select, ColorInput, Slider, Label, Tabs).
- No code comments unless explicitly asked.

## Architecture Map

```
src/
  main.tsx               # React root (StrictMode)
  App.tsx                # RouterProvider
  app/router.tsx         # / → DataViewerPage, /layout → LayoutDesignerPage
  types/                 # layers.ts, layout.ts — source of truth for data shapes
  store/                 # useLayersStore.ts, useLayoutStore.ts (Zustand)
  lib/                   # mapRef singleton, gdal parsers, projection, scale, pdf, icons
  components/
    data-viewer/         # DataViewerPage, MapPreview, LayerList, ExportMapButton, AddServiceDialog
    layout-designer/      # LayoutDesignerPage, LayoutCanvas, LayoutToolbar, PageSetupBar, PropertiesPanel, ExportDialog
      elements/          # MapFrameElement, NorthArrowElement, ScaleBarElement, LegendElement, LogoElement, TextElement, TechnicalDescriptionElement
    shared/ui/
```

Two routes, two workflows:
1. **`/` Data Viewer**: drag/drop + add-layer -> parse in `lib/gdal/*` -> add OL layer + entry in `useLayersStore`.
2. **`/layout` Layout Designer**: Konva canvas. `ExportMapButton` computes the combined visible extent (`getCombinedVisibleExtent()` in `lib/mapRef.ts`), creates a map frame element, then navigates here.

## State Management Rules

- Two independent Zustand stores: `useLayersStore` (GIS layers) and `useLayoutStore` (page config + layout elements + undo/redo + selection).
- **The layout store reads from the layers store but never mutates it.** Keep this boundary — do not write back to `useLayersStore` from layout components.
- `useLayoutStore` keeps full-state JSON snapshots for undo/redo. Any new mutating action must push the prior `{ elements, pageConfig }` snapshot to `undoStack` and clear `redoStack`, mirroring the existing `addElement`/`updateElement`/`removeElement` pattern.
- Use the store's factory functions (`createMapFrame`, `createNorthArrow`, `createScaleBar`, `createLegend`, `createTextElement`) for new elements rather than hand-rolling defaults.

## `mapRef` Singleton

`lib/mapRef.ts` holds a module-level OL `Map` instance so it survives React StrictMode remounts and route navigation. `MapPreview` reattaches the existing map to its DOM target instead of recreating it; do not destroy the map on unmount — only `setTarget(undefined)`. Read OL layers via `getOlLayerByGisId(id)` (each OL layer carries `properties: { gisId }` matching the store layer id).

## Reconstruction Data

The layout's `MapFrameElement` re-renders an offscreen OL map from data stored in `useLayersStore`, not from the live map (which is destroyed on unmount). Every layer type must persist its reconstruction payload:
- `raster` → `dataUrl` (canvas data URL)
- `vector` / `wfs` → `geojsonData` (raw GeoJSON text)
- `wms` → `serviceUrl` + `layerName`

When adding a new data format or layer type, extend `types/layers.ts`, the layers store add method, the parser in `lib/gdal/`, **and** the reconstruction branch in `MapFrameElement.tsx`. Otherwise it will render in the Data Viewer but not in the exported layout.

## Projections

`lib/projection/proj4Defs.ts` ships 128+ EPSG definitions and integrates them with OL via `proj4.registerAll()` / `registerProjection()`. Before reading vector data, parsers call `ensureCrsRegistered(crs, prjText?)`. Any new CRS handling should go through this helper, not raw `proj4.defs` calls. The map view is always `EPSG:3857`; transforms use `transformExtent` and `GeoJSONFormat({ dataProjection, featureProjection: 'EPSG:3857' })`.

## PDF Export

`ExportDialog` rasterizes the Konva stage via `stageRef.current.toDataURL()` and passes it to `exportToPdf()` in `lib/pdf/exportPdf.ts`, which builds a jsPDF doc with mm units matched to the page size/orientation. WMS layers require `crossOrigin: 'anonymous'` on their source to remain canvas-exportable — preserve this when touching WMS code.

## Adding Things — Where To Edit

| Task | Files |
|---|---|
| New layout element kind | `types/layout.ts` (type + `kind`), `store/useLayoutStore.ts` (factory + undo snapshot wiring), `components/layout-designer/elements/<Kind>Element.tsx`, `LayoutCanvas.tsx` (render dispatch), `LayoutToolbar.tsx` (button), `PropertiesPanel.tsx` (props editor), `lib/pdf/exportPdf.ts` only if it needs special PDF handling |
| New data format | `types/layers.ts`, `store/useLayersStore.ts` (add method), `lib/gdal/parse*.ts`, `components/data-viewer/MapPreview.tsx` (load entry), `components/layout-designer/elements/MapFrameElement.tsx` (reconstruction branch) |
| New projection | `lib/projection/proj4Defs.ts` |
| Change map controls | `components/data-viewer/MapPreview.tsx` |
| Change layer list UI | `components/data-viewer/LayerList.tsx` |
| Change PDF output | `lib/pdf/exportPdf.ts`, `components/layout-designer/ExportDialog.tsx` |

## Gotchas

- The `TechnicalDescriptionElement` exists in `elements/` and is rendered from `LayoutCanvas.tsx` but is not covered by the older docs — read the file directly rather than trusting the docs table.
- `react-konva` element handlers receive Konva objects, not DOM events; selectors must read from the store by id, not from event targets.
- Never assume a default export where the file uses named exports (and vice versa) — check the import site before adding a new module.
- Build is the only typecheck. Lint does not run `tsc`.