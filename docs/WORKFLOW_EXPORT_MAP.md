# Workflow B: Export Map / Layout Designer

This workflow covers the print-layout designer triggered by clicking "Export Map" in the Data Viewer.

## Entry Point

`ExportMapButton` → `LayoutDesignerPage` at route `/layout`

## Bridge: ExportMapButton

```
User clicks "Export Map"
  │
  ▼
ExportMapButton.handleExport()
  │
  ├─ getCombinedVisibleExtent()              # lib/mapRef.ts
  │   └─ Iterates OL layers, unions extents of those with gisId
  │
  ├─ useLayoutStore.setElements([])          # Clear previous layout
  ├─ useLayoutStore.{undoStack,redoStack} = []
  │
  ├─ createMapFrame(extent)                  # Factory in useLayoutStore
  │   └─ Maps extent to page area minus margins
  │
  ├─ useLayoutStore.addElement(mapFrame)
  │   └─ Snapshots state for undo, selects the new element
  │
  └─ navigate('/layout')
```

## Layout Designer Page Structure

```
LayoutDesignerPage
  ├─ Header: "Back" button + "Export to PDF" button
  ├─ PageSetupBar: paper size / orientation / DPI / margins
  ├─ Main area:
  │   ├─ LayoutToolbar (left sidebar)
  │   ├─ LayoutCanvas (center)
  │   └─ PropertiesPanel (right sidebar)
  └─ ExportDialog (modal, on demand)
```

## LayoutCanvas Rendering

```
LayoutCanvas
  │
  ├─ Reads pageConfig from useLayoutStore
  ├─ Computes canvas size: pageWx2 × pageHx2 (2x mm→px scale)
  │
  ├─ Stage (Konva)
  │   └─ Layer
  │       ├─ Rect (white page background)
  │       ├─ Rect (dashed margin guides)
  │       └─ elements.map(renderElement)
  │           └─ Dispatches by element.kind:
  │               'mapframe'   → MapFrameElement({ element, scale: 2 })
  │               'northarrow' → NorthArrowElement({ element })
  │               'scalebar'   → ScaleBarElementRenderer({ element })
  │               'legend'     → LegendElementRenderer({ element })
  │               'logo'       → LogoElement({ element })
  │               'text'       → TextElementRenderer({ element })
```

## MapFrameElement Rendering (Critical Path)

This is the most complex element — it re-creates an offscreen OpenLayers map from stored layer data and captures it as a Konva image.

```
MapFrameElement mounts
  │
  ├─ Creates offscreen <div>
  ├─ new Map({ target: div, layers: [OSM basemap], view: EPSG:3857 })
  │
  └─ useEffect([w, h, layers, extent]):
      │
      ├─ Removes old gisId layers from offscreen map
      │
      ├─ For each visible layer in useLayersStore:
      │   │
      │   ├─ raster + dataUrl:
      │   │   ├─ transformExtent(extent, crs, 'EPSG:3857')
      │   │   ├─ new Static({ url: dataUrl, projection: 'EPSG:3857', imageExtent })
      │   │   ├─ new ImageLayer({ source })
      │   │   └─ map.addLayer(imgLayer)
      │   │
      │   ├─ vector/wfs + geojsonData:
      │   │   ├─ JSON.parse(geojsonData)
      │   │   ├─ new GeoJSONFormat({ dataProjection: crs, featureProjection: 'EPSG:3857' })
      │   │   ├─ format.readFeatures(geojson)
      │   │   ├─ new VectorSource({ features })
      │   │   ├─ new VectorLayer({ source, style: { fill, stroke, circle } })
      │   │   └─ map.addLayer(vecLayer)
      │   │
      │   └─ wms:
      │       ├─ new ImageWMS({ url, params: { LAYERS, ... }, crossOrigin: 'anonymous', projection: 'EPSG:3857' })
      │       ├─ new ImageLayer({ source })
      │       └─ map.addLayer(imgLayer)
      │
      ├─ map.getView().fit(combinedExtent)    # Zoom to all visible layers
      │
      ├─ DETECTS WMS sources → waits for imageloadend events
      │   │
      │   ├─ If WMS layers exist:
      │   │   ├─ Register src.once('imageloadend', ...) for each WMS source
      │   │   ├─ map.renderSync()                # Start loading images
      │   │   └─ On all loaded:
      │   │       ├─ map.renderSync()            # Compose with images
      │   │       └─ map.once('rendercomplete') → capture canvas
      │   │
      │   └─ If no WMS layers:
      │       ├─ map.once('rendercomplete') → capture canvas
      │       └─ map.renderSync()
      │
      └─ capture():
          ├─ canvas.toDataURL()                 # Get raster snapshot
          └─ setImage(dataUrl)                  # → Konva Image rendered
```

## Adding Layout Elements

### North Arrow
```
LayoutToolbar → createNorthArrow() → useLayoutStore.addElement(element)
  │
  NorthArrowElement renders:
  ├─ northArrowPresets[element.preset]          # SVG path string
  ├─ Path scaled to element.width × element.height
  └─ Draggable, selectable, fill/stroke from properties
```

### Scale Bar
```
LayoutToolbar → createScaleBar() → useLayoutStore.addElement(element)
  │
  ScaleBarElementRenderer:
  ├─ Finds linked MapFrameElement from elements array
  ├─ computeScale(mapFrame, scaleBar, segs):
  │   ├─ groundUnitsPerMm = extentWidth / frameWidthMm
  │   ├─ totalGround = groundUnitsPerMm × scaleBar.width
  │   ├─ niceTotal = niceRound(totalGround)
  │   ├─ segmentGround = niceTotal / segs
  │   ├─ Respects user's unit choice (auto/m/km)
  │   └─ scale ratio = 1:X displayed above bar
  │
  ├─ Draws line/bar with tick marks
  ├─ Labels segments with real-world distances
  └─ Shows unit label (m/km)
```

### Legend
```
LayoutToolbar → createLegend() → useLayoutStore.addElement(element)
  │
  LegendElementRenderer:
  ├─ Reads visible layers from useLayersStore
  ├─ For each layer: color patch + name + vector stroke indicator
  └─ Auto-populated, configurable title/columns
```

### Grid Lines
```
LayoutToolbar → toggleGrid()
  │
  useLayoutStore.updateElement(mapFrame.id, { gridConfig: { enabled: !current } })
  │
  MapFrameElement renders grid when enabled:
  ├─ spacingPx = gridConfig.spacingX × scale
  ├─ Vertical + horizontal Line elements
  ├─ Dashed/solid, configurable color/width
  └─ Optional coordinate labels (inside/outside/none)
```

## PDF Export Pipeline

```
ExportDialog.handleExport()
  │
  ├─ stageRef.current.toDataURL()              # Rasterize Konva stage
  │
  └─ exportPdf.ts: exportToPdf(canvasDataUrl, pageConfig)
      │
      ├─ Computes physical page size from paper size + orientation
      ├─ new jsPDF({ orientation, unit: 'mm', format })
      ├─ doc.addImage(canvasDataUrl, 'PNG', 0, 0, pageWmm, pageHmm)
      └─ doc.save('map.pdf')
```

## Undo/Redo

Every mutation in `useLayoutStore` (addElement, updateElement, removeElement) snapshots the entire `elements` and `pageConfig` state before applying the change:

```
useLayoutStore.addElement(element)
  │
  ├─ snapshot = { elements, pageConfig }        # Deep clone via JSON
  ├─ undoStack.push(snapshot)
  ├─ redoStack = []                             # Clear redo on new action
  └─ elements = [...elements, element]

useLayoutStore.undo()
  │
  ├─ prev = undoStack.pop()
  ├─ redoStack.push(current snapshot)
  └─ Restore elements + pageConfig from prev

useLayoutStore.redo()
  │
  ├─ next = redoStack.pop()
  ├─ undoStack.push(current snapshot)
  └─ Restore elements + pageConfig from next
```
