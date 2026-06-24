# Projection and CRS Handling

## Overview

All display and export uses **EPSG:3857 (Web Mercator)** as the map view projection. Source data in any CRS is reprojected on load using OpenLayers `GeoJSONFormat` (vectors) or `transformExtent` (rasters).

## Registered Projections

`src/lib/projection/proj4Defs.ts` registers 128 EPSG codes at application startup:

| Category | Codes | Notes |
|---|---|---|
| Geographic | EPSG:4326 (WGS84), EPSG:4269 (NAD83) | Lat/lon |
| UTM North | EPSG:32601–32660 | Zones 1–60 |
| UTM South | EPSG:32701–32760 | Zones 1–60 (with `+south`) |
| National grids | EPSG:27700 (OSGB36), EPSG:2154 (RGF93/Lambert-93) | UK, France |
| Web Mercator | EPSG:3857 | Default map view projection |

Additional CRS definitions can be registered dynamically via `registerProjection(code, projString)`.

## OL + proj4 Integration

The `register(proj4)` call from `ol/proj/proj4` is invoked at the top of every parser and the MapFrameElement. This bridges OpenLayers' projection system with proj4js, enabling `transformExtent()` and `GeoJSONFormat` reprojection to work with any registered CRS.

## Vector Reprojection

All vector data (GeoJSON, Shapefile, WFS) is reprojected during parsing using `GeoJSONFormat`:

```typescript
const format = new GeoJSONFormat({
  dataProjection: sourceCrs,      // e.g. 'EPSG:4326' (lat/lon)
  featureProjection: 'EPSG:3857', // map view projection (meters)
})
const features = format.readFeatures(geojson)
```

This converts every coordinate in every feature from the source CRS to EPSG:3857. After this, all features have coordinates in Web Mercator meters.

### CRS Detection Priority

For GeoJSON files, the CRS is detected from:

1. `geojson.crs.properties.name` — direct EPSG code
2. Normalized via `normalizeCrs()`:
   - `urn:ogc:def:crs:EPSG::32651` → `EPSG:32651`
   - `urn:ogc:def:crs:EPSG:9.2:4326` → `EPSG:4326`
   - `CRS:84` / `urn:ogc:def:crs:OGC:1.3:CRS84` → `EPSG:4326`
   - Falls back to extracting 4-5 digit EPSG code from any string
3. Defaults to `EPSG:4326` if nothing else found

For Shapefile `.prj` files, the CRS is detected via:
```typescript
const match = prjText.match(/EPSG[":\s]*(\d+)/i)
```
This matches `AUTHORITY["EPSG","32651"]` in WKT `.prj` text.

## Raster Reprojection

Raster data (GeoTIFF) is handled differently — the image is rendered at its native pixel grid, but the extent (bounding box) is reprojected:

```typescript
import { transformExtent } from 'ol/proj'

// Extent is in source CRS (e.g. EPSG:32651 meters)
const sourceExtent = [minX, minY, maxX, maxY]

// Reproject to EPSG:3857
const olExtent = transformExtent(sourceExtent, sourceCrs, 'EPSG:3857')

// Create OL layer with reprojected extent
const source = new Static({
  url: dataUrl,
  projection: new Projection({ code: 'EPSG:3857', units: 'm' }),
  imageExtent: olExtent,
})
```

The image pixels are not resampled — only the placement on the map is adjusted. This is acceptable for print layout where the DPI matches the source resolution.

### Fallback

If `transformExtent` fails (CRS not registered), the code falls back to proj4's `forward()`:

```typescript
try {
  olExtent = transformExtent(extent, crs, 'EPSG:3857')
} catch {
  const fromProj = proj4(crs, 'EPSG:3857')
  const ll = fromProj.forward([extent[0], extent[1]])
  const ur = fromProj.forward([extent[2], extent[3]])
  olExtent = [ll[0], ll[1], ur[0], ur[1]]
}
```

## WMS Projection

WMS layers use the map's view projection:

```typescript
const source = new ImageWMS({
  url: serviceUrl,
  params: { LAYERS: ..., VERSION: '1.3.0' },
  projection: 'EPSG:3857',
  crossOrigin: 'anonymous',
})
```

OL constructs the WMS `GetMap` request with `CRS=EPSG:3857` and the appropriate BBOX. If the WMS server doesn't support EPSG:3857, the request fails and the layer won't render.

## WFS Projection

WFS features are fetched as GeoJSON, then reprojected using the same `GeoJSONFormat` pipeline as local files:

```typescript
const format = new GeoJSONFormat({
  dataProjection: crs,         // User-specified CRS from dialog
  featureProjection: 'EPSG:3857',
})
const features = format.readFeatures(parsedGeojson)
```

The WFS `GetFeature` request includes `srsName=crs` to request data in the user's chosen CRS.

## Scale Bar and CRS

The scale bar computes real-world distances from the map frame's extent:

```typescript
const [minX, _, maxX] = mapFrame.extent     // In EPSG:3857 (meters)
const extentWidth = Math.abs(maxX - minX)   // Width in meters
const frameWidthMm = mapFrame.width          // Frame width in mm

const groundUnitsPerMm = extentWidth / frameWidthMm
// e.g. 5000m / 100mm = 50 meters per mm on page
```

This is CRS-agnostic — it works for any projection where the extent units are meters (EPSG:3857, UTM, Lambert, etc.). For lat/lon extents, the scale denominator would be unusually large (>1e8), which is acceptable as an approximate scale.

## Export Reconstruction

When reconstructing layers in the MapFrameElement (layout designer), each layer type is reprojected:

| Layer type | Reprojection method |
|---|---|
| raster | `transformExtent(extent, crs, 'EPSG:3857')` |
| vector | `GeoJSONFormat({ dataProjection: crs, featureProjection: 'EPSG:3857' })` |
| wfs | Same as vector — GeoJSONFormat with dataProjection |
| wms | Source configured with `projection: 'EPSG:3857'` |

All layers end up in EPSG:3857 on the offscreen map, and the canvas snapshot captures them in that projection.
