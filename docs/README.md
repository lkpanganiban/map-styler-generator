# Documentation

## Index

| Document | Contents |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Project structure, tech stack, design decisions, two-store architecture |
| [WORKFLOW_LOAD_DATA.md](./WORKFLOW_LOAD_DATA.md) | Function call chains for loading GeoTIFF, GeoJSON, Shapefile, WMS, WFS |
| [WORKFLOW_EXPORT_MAP.md](./WORKFLOW_EXPORT_MAP.md) | Layout designer rendering, element reconstruction, PDF export pipeline, undo/redo |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | Zustand store design, layer sync, cross-page data flow, mapRef singleton |
| [PROJECTION_AND_REPROJECTION.md](./PROJECTION_AND_REPROJECTION.md) | CRS handling, vector/raster/WMS/WFS reprojection, registered EPSG codes |

## Quick Reference

### Start the app
```bash
npm install
npm run dev
```

### Build for production
```bash
npm run build
```

### Key files for common tasks

| Task | Files to modify |
|---|---|
| Add a new layout element | `types/layout.ts`, `store/useLayoutStore.ts` (factory), `components/layout-designer/elements/`, `LayoutCanvas.tsx` (render dispatch), `LayoutToolbar.tsx` (button), `PropertiesPanel.tsx` (props) |
| Add a new data format | `types/layers.ts`, `store/useLayersStore.ts`, `lib/gdal/`, `components/layout-designer/elements/MapFrameElement.tsx` (reconstruction) |
| Change PDF export behavior | `lib/pdf/exportPdf.ts`, `components/layout-designer/ExportDialog.tsx` |
| Change map controls | `components/data-viewer/MapPreview.tsx` |
| Add projections | `lib/projection/proj4Defs.ts` |
| Modify layer UI | `components/data-viewer/LayerList.tsx` |
