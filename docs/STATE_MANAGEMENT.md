# State Management

## Store Architecture

The application uses two independent Zustand stores. They are deliberately **not** cross-coupled — the layout designer reads from the layers store at render time, never mutating it.

```
┌─────────────────────────┐     ┌──────────────────────────┐
│   useLayersStore        │     │   useLayoutStore         │
│                         │     │                          │
│  layers: LayerUnion[]   │     │  pageConfig: PageConfig  │
│                         │     │  elements: LayoutElement[]│
│  addRaster()            │     │  selectedId: string|null │
│  addVector()            │     │  undoStack / redoStack   │
│  addWms()               │     │                          │
│  addWfs()               │     │  addElement()            │
│  removeLayer()          │     │  updateElement()         │
│  toggleVisibility()     │ read│  removeElement()         │
│  setOpacity()           │────▶│  selectElement()         │
│  setVectorStyle()       │only │  setPageConfig()         │
│  reorder()              │     │  undo() / redo()         │
│  clearAll()             │     │                          │
│                         │     │  createMapFrame()        │
└─────────────────────────┘     │  createNorthArrow()      │
                                │  createScaleBar()        │
                                │  createLegend()          │
                                │  createTextElement()     │
                                └──────────────────────────┘
```

## useLayersStore

### Data Shape

```typescript
interface LayersStore {
  layers: LayerUnion[]  // RasterLayer | VectorLayer | WmsLayer | WfsLayer
}
```

### Layer Types

| Type | Key fields | Reconstruction data |
|---|---|---|
| `raster` | extent, crs, bands, dataUrl | `dataUrl` (canvas Data URL from GeoTIFF) |
| `vector` | crs, style, featureCount, geojsonData | `geojsonData` (raw GeoJSON text) |
| `wms` | serviceUrl, layerName, crs, extent | `serviceUrl` + `layerName` (params for ImageWMS) |
| `wfs` | serviceUrl, typename, crs, style, geojsonData | `geojsonData` (fetched result from WFS GetFeature) |

Each layer also has `id`, `name`, `visible: boolean`, `opacity: number` from the base type.

### Visibility/Opticity/Style Sync

The store holds the source of truth. The `LayerList` component syncs to the OL map:

```typescript
// LayerList.handleToggle(id)
toggleVisibility(id)           // store
getOlLayerByGisId(id)          // find OL layer by gisId property
  ?.setVisible(!current)       // sync to map

// LayerList.handleOpacity(id, opacity)
setOpacity(id, opacity)        // store
getOlLayerByGisId(id)
  ?.setOpacity(opacity)        // sync to map

// LayerList.handleColorChange(id, prop, value)
setVectorStyle(id, { [prop]: value })  // store
getOlLayerByGisId(id)
  ?.setStyle(new Style({ fill, stroke, circle }))  // sync to map
```

## useLayoutStore

### Data Shape

```typescript
interface LayoutState {
  pageConfig: PageConfig        // paper size, orientation, dpi, margins
  elements: LayoutElement[]     // all layout elements
  selectedId: string | null     // currently selected element
  undoStack: LayoutSnapshot[]   // previous states
  redoStack: LayoutSnapshot[]   // undone states
}
```

### Element Types

| Kind | Config |
|---|---|
| `mapframe` | extent, gridConfig (enabled, spacing, line style, color, labels) |
| `northarrow` | preset, angle, fillColor, strokeColor |
| `scalebar` | segments, units (auto/m/km), barStyle, colors, linkedMapFrameId |
| `legend` | title, columns, font, items[] |
| `logo` | imageDataUrl, lockedAspect |
| `text` | text, fontFamily, fontSize, fontColor, bold, italic, alignment, bg/border |

### Undo/Redo

Each mutation snapshots the complete `elements` + `pageConfig` state:

```
Before mutation:
  undoStack: [snap1, snap2, snap3]
  redoStack: []

addElement(el):
  undoStack: [snap1, snap2, snap3, snap4(current)]
  redoStack: []                      # cleared
  elements: [...previous, el]        # new element added

undo():
  undoStack: [snap1, snap2, snap3]
  redoStack: [snap4(current)]
  elements: elements from snap4      # restored

redo():
  undoStack: [snap1, snap2, snap3, snap(current)]
  redoStack: []
  elements: elements from snap       # re-applied
```

### Factory Functions

The store exports factory functions that create default elements with sensible positions:

- `createMapFrame(extent)` — sizes to page area minus margins
- `createNorthArrow()` — 20×30mm, top-right area
- `createScaleBar()` — 60×12mm, bottom-left area
- `createLegend()` — 50×40mm, bottom-right area
- `createTextElement(text)` — 200×30mm, top-left area

## Cross-Page Data Flow

```
DataViewerPage (/)                    LayoutDesignerPage (/layout)
     │                                       │
     │  ExportMapButton.click()              │
     │  ──────────────────────────▶          │
     │  1. getCombinedVisibleExtent()        │
     │  2. createMapFrame(extent)            │
     │  3. addElement(mapFrame)  ──▶ store   │
     │  4. navigate('/layout')     │         │
     │                              │         │
     │                    ┌────────▼───────┐ │
     │                    │ useLayoutStore │ │
     │                    │  elements: [   │ │
     │                    │    mapFrame    │ │
     │                    │  ]             │ │
     │                    └────────┬───────┘ │
     │                             │         │
     │                             └────────▶│
     │                                LayoutCanvas reads elements
     │                                MapFrameElement reads layers
     │                                from useLayersStore (read-only)
     │
     │  ◀───────── "Back" button   ──────────
     │  MapPreview reattaches OL map
     │  (map survives in mapRef singleton)
```

## mapRef Singleton

```typescript
// lib/mapRef.ts
let mapInstance: Map | null = null

setMapInstance(map)   // MapPreview calls on mount
getMapInstance()      // Returns current map or null

getOlLayerByGisId(gisId)   // Finds OL layer by gisId property
getCombinedVisibleExtent() // Unions all visible layer extents
```

The singleton design ensures:
- The OL map survives React StrictMode remounts (mount → unmount → remount)
- The map persists across route navigation (going back from /layout to /)
- Layers, extent, and view state are preserved
