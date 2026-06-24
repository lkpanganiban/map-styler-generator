# Architecture

## Overview

Map Generator is a fully client-side React SPA for GIS data visualization and print-layout design. It has two main workflows:

1. **Workflow A — Data Viewer** (`/`): Load raster/vector GIS data, preview on an interactive OpenLayers map, manage layer visibility and styles.
2. **Workflow B — Layout Designer** (`/layout`): Arrange map frames, north arrows, scale bars, legends, logos, text, and grid lines on a print-ready Konva canvas, then export to PDF.

The two workflows are connected: clicking "Export Map" in the Data Viewer captures the current extent and navigates to the Layout Designer.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript 6 + Vite 8 |
| Map Rendering | OpenLayers 8 (`ol`) |
| Layout Canvas | Konva (`react-konva`) |
| State Management | Zustand (two stores: layers + layout) |
| CRS Reprojection | proj4js + OL's `ol/proj/transformExtent` |
| Raster Parsing | geotiff.js |
| Shapefile Parsing | shpjs |
| PDF Export | jsPDF |
| Styling | Tailwind CSS 4 (white/gray palette) |
| Icons | lucide-react |
| UI Primitives | Custom shadcn-style components |

## Project Structure

```
src/
  main.tsx                     # React root + StrictMode
  App.tsx                      # RouterProvider
  index.css                    # Tailwind directives + OL control overrides
  app/
    router.tsx                 # / → DataViewerPage, /layout → LayoutDesignerPage
  types/
    layers.ts                  # RasterLayer, VectorLayer, WmsLayer, WfsLayer
    layout.ts                  # All element types (MapFrame, NorthArrow, etc.) + PageConfig
  store/
    useLayersStore.ts          # Layer list: CRUD + visibility/opacity/style
    useLayoutStore.ts          # Layout elements: CRUD + undo/redo + element factories
  components/
    data-viewer/
      DataViewerPage.tsx       # Main page: map + drag-drop + layer list + service dialog
      MapPreview.tsx           # OpenLayers map with controls (zoom, scale line, coords)
      LayerList.tsx            # Layer panel with visibility/opacity/color controls
      ExportMapButton.tsx      # "Export Map" → captures extent, navigates to /layout
      AddServiceDialog.tsx     # Modal for adding WMS/WFS services
    layout-designer/
      LayoutDesignerPage.tsx   # Layout page: canvas + toolbar + properties
      LayoutCanvas.tsx         # Konva Stage + page border + margin guides
      LayoutToolbar.tsx        # Add element buttons + undo/redo/delete/grid
      PageSetupBar.tsx         # Paper size, orientation, DPI, margins
      PropertiesPanel.tsx      # Context-sensitive property editor for selected element
      ExportDialog.tsx         # Preview + "Download PDF" button
      elements/
        MapFrameElement.tsx    # Offscreen OL map → Konva Image + grid overlay
        NorthArrowElement.tsx  # SVG path-based north arrow
        ScaleBarElement.tsx    # Scale bar with computed real-world labels
        LegendElement.tsx      # Auto-populated legend from layers
        LogoElement.tsx        # Image upload → Konva Image
        TextElement.tsx        # Styled text with font/bold/italic/alignment
    shared/ui/                 # Button, Input, Select, ColorInput, Slider, Label, Tabs
  lib/
    gdal/
      parseGeotiff.ts          # GeoTIFF → OL ImageLayer + data URL
      parseShapefile.ts        # SHP+DBF+PRJ → OL VectorLayer + GeoJSON
      parseGeoJSON.ts          # GeoJSON → OL VectorLayer
      parseWms.ts              # WMS URL → OL ImageLayer (ImageWMS)
      parseWfs.ts              # WFS URL → OL VectorLayer (fetches GeoJSON)
    mapRef.ts                  # Singleton OL map reference + visible extent computation
    projection/
      proj4Defs.ts             # 128 EPSG definitions + dynamic registration + OL integration
    scale/
      scaleUtils.ts            # Map scale math + nice segment rounding
    icons/
      northArrows.ts           # 5 SVG path presets for north arrows
    pdf/
      exportPdf.ts             # jsPDF pipeline: canvas data URL → PDF download
```

## Two Stores, One App

All application state lives in two Zustand stores:

### `useLayersStore`
Holds the list of loaded GIS layers. Each layer is one of four types: `raster`, `vector`, `wms`, or `wfs`. The store provides CRUD methods (`addRaster`, `addVector`, `addWms`, `addWfs`, `removeLayer`, `toggleVisibility`, `setOpacity`, `setVectorStyle`). For export, it stores reconstruction data (`dataUrl` for rasters, `geojsonData` for vectors/WFS, `serviceUrl`+params for WMS).

### `useLayoutStore`
Holds page configuration (paper size, orientation, DPI, margins) and the list of layout elements (map frames, north arrows, scale bars, legends, logos, text). Each element has id, kind, position (x, y, w, h, rotation) and kind-specific config. The store provides full undo/redo via snapshot stacks and factory functions for creating default elements.

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Konva for layout canvas | Native support for drag, resize, rotate, hit detection — essential for a QGIS-like layout designer |
| Offscreen OL map in MapFrameElement | The main map is destroyed on unmount; reconstruction allows any layer type to render on the layout |
| Layer reconstruction data in store | `dataUrl`, `geojsonData`, and service URLs survive navigation and allow independent rendering |
| proj4 + OL `transformExtent` | Handles CRS reprojection for 128+ projections without server-side GDAL |
| Singleton map ref in `mapRef.ts` | Enables map retention across React StrictMode remounts and cross-component access |
| Undo/redo via JSON snapshots | Simple, reliable — snapshots the full elements + pageConfig on every mutation |
