# Map Generator

A browser-based QGIS Print Layout-style map designer. Load raster and vector GIS data, customize a map layout with north arrow, scale bar, legend, logos, and text, then export to PDF.

## Prerequisites

- **Node.js** >= 22
- **npm** >= 10

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Load Data

1. Open the app — the map viewer loads with an OpenStreetMap basemap
2. Drag and drop GIS files onto the map, or click **Add Layer** to pick files
3. Supported formats:
   - **Raster**: GeoTIFF (`.tif`, `.tiff`)
   - **Vector**: GeoJSON (`.geojson`, `.json`), Shapefile (`.shp` + `.dbf` + `.prj` + `.shx`)

### Manage Layers

- Each loaded layer appears in the **Layers** panel (top-left)
- Toggle visibility with the eye icon — hidden layers are excluded from export
- Adjust opacity with the slider
- Vector layers: click the chevron to expand and change fill/stroke colors
- Remove layers with the trash icon

### Export Map

1. Click **Export Map** (top-right) once layers are loaded
2. You are taken to the **Map Layout Designer** where you can customize:
   - **Page setup**: paper size (A4/A3/Letter), orientation, DPI, margins
   - **Map frame**: the main map area — resizable, draggable
   - **North arrow**: 5 preset styles, custom fill/rotation
   - **Scale bar**: configurable segments, units (auto/m/km), bar/line style
   - **Legend**: auto-populated from visible layers
   - **Logo**: upload PNG/SVG images
   - **Text**: custom labels with font, size, color, bold/italic, alignment

3. Select an element on the canvas to edit its properties in the right panel
4. Click **Export to PDF** when done

### Toolbar Controls

| Button | Action |
|---|---|
| North Arrow | Add a north arrow |
| Scale Bar | Add a scale bar (linked to map frame) |
| Legend | Add auto-populated legend |
| Text | Add a text label |
| Logo | Upload and add an image |
| Trash | Delete selected element |
| Undo / Redo | Step through layout changes |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build (TypeScript + Vite) |
| `npm run lint` | Run oxlint linter |
| `npm run preview` | Preview production build |

## Tech Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- **OpenLayers 8** — map rendering, reprojection, controls
- **Konva** + **react-konva** — drag-and-drop layout canvas
- **Zustand** — state management
- **jsPDF** — PDF export
- **proj4** — CRS transformations
- **geotiff.js** — GeoTIFF parsing
- **shpjs** — Shapefile parsing
- **Tailwind CSS 4** — styling
