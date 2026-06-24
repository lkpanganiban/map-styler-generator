# Workflow A: Loading Data

This workflow covers loading raster and vector GIS data into the map viewer.

## Entry Point

`DataViewerPage` at route `/`

## UI Flow

```
User drops files / clicks "Add Layer" / clicks "Add Service"
  │
  ▼
DataViewerPage.processFiles() or AddServiceDialog.handleAdd()
```

## Function Call Chains

### 1. Loading a GeoTIFF file

```
DataViewerPage.processFiles(fileList)
  │
  ├─ Groups files by type
  │
  └─ For .tif/.tiff files:
      parseGeotiff.ts: parseGeoTIFF(file, olMap)
        │
        ├─ geotiff.fromArrayBuffer(buffer)           # Parse TIFF
        ├─ image.getBoundingBox()                      # Get native extent
        ├─ image.getGeoKeys()                          # Extract EPSG code
        ├─ image.readRasters()                         # Read pixel data
        ├─ Canvas 2D rendering                        # Create data URL image
        │
        ├─ useLayersStore.addRaster(name, extent, crs, bands, dataUrl)
        │   └─ Creates RasterLayer in store
        │
        ├─ register(proj4)                            # OL + proj4 integration
        ├─ transformExtent(extent, crs, 'EPSG:3857')   # Reproject extent
        │
        ├─ new Static({ url: dataUrl, projection: 'EPSG:3857', imageExtent })
        ├─ new ImageLayer({ source, properties: { gisId } })
        ├─ olMap.addLayer(imgLayer)
        └─ olMap.getView().fit(olExtent)              # Zoom to layer
```

### 2. Loading a GeoJSON file

```
DataViewerPage.processFiles(fileList)
  │
  └─ For .geojson/.json files:
      parseGeoJSON.ts: parseGeoJSON(file, olMap)
        │
        ├─ FileReader.readAsText(file)                # Read file content
        ├─ JSON.parse(text)                            # Parse GeoJSON
        ├─ normalizeCrs(crs)                           # URN → EPSG:XXXX format
        │   ├─ /urn:ogc:def:crs:EPSG:{0,2}(\d+)/i → EPSG:(\d+)
        │   └─ Falls back to extracting \d{4,5} from string
        │
        ├─ ensureCrsRegistered(crs)                   # Check proj4 defs
        │   └─ If missing, registerProjection(crs, ...)
        │
        ├─ new GeoJSONFormat({                        # CRITICAL: sets reprojection
        │     dataProjection: crs,                    # Source CRS (e.g. EPSG:4326)
        │     featureProjection: 'EPSG:3857'          # Target CRS (map view)
        │   })
        ├─ format.readFeatures(geojson)               # OL reprojects features
        │
        ├─ useLayersStore.addVector(name, crs, featureCount, rawText)
        │   └─ Stores raw GeoJSON text as geojsonData for reconstruction
        │
        ├─ new VectorSource({ features })
        ├─ new VectorLayer({ source, properties: { gisId } })
        ├─ olMap.addLayer(vecLayer)
        └─ olMap.getView().fit(sourceExtent)
```

### 3. Loading a Shapefile

```
DataViewerPage.processFiles(fileList)
  │
  ├─ Groups .shp/.dbf/.prj/.shx by basename
  │
  └─ For each group:
      parseShapefile.ts: parseShapefile(files, olMap)
        │
        ├─ Reads .prj file to detect CRS         # AUTHORITY["EPSG","XXXX"]
        ├─ ensureCrsRegistered(crs, prjText)      # Register if unknown
        │
        ├─ parseShapefileInternal(shp, dbf, crs)
        │   ├─ shpjs(shpBuffer)                   # Parse SHP to GeoJSON
        │   ├─ new GeoJSONFormat({                # REPROJECTION
        │   │     dataProjection: crs,
        │   │     featureProjection: 'EPSG:3857'
        │   │   })
        │   ├─ format.readFeatures(fc)
        │   └─ JSON.stringify(fc) → geojsonText
        │
        ├─ useLayersStore.addVector(name, crs, featureCount, geojsonText)
        ├─ new VectorSource({ features })
        ├─ new VectorLayer({ source, properties: { gisId } })
        ├─ olMap.addLayer(vecLayer)
        └─ olMap.getView().fit(sourceExtent)
```

### 4. Adding a WMS service

```
AddServiceDialog.handleAdd()
  │
  └─ parseWms.ts: addWmsToMap(olMap, name, serviceUrl, layerName, crs)
        │
        ├─ useLayersStore.addWms(name, url, layerName, crs, worldExtent)
        │
        ├─ new ImageWMS({
        │     url, params: { LAYERS, VERSION, FORMAT },
        │     crossOrigin: 'anonymous'             # Enable canvas export
        │   })
        ├─ new ImageLayer({ source, properties: { gisId } })
        ├─ olMap.addLayer(imgLayer)
        └─ source.once('imageloadend', () => fit view)
```

### 5. Adding a WFS service

```
AddServiceDialog.handleAdd()
  │
  └─ parseWfs.ts: addWfsToMap(olMap, name, serviceUrl, typename, crs)
        │
        ├─ Constructs WFS GetFeature URL:
        │     service=WFS&version=2.0.0&request=GetFeature
        │     &typeNames=typename&outputFormat=application/json
        │     &srsName=crs
        │
        ├─ fetch(url) → geojsonData (raw text)
        │
        ├─ useLayersStore.addWfs(name, url, typename, crs, geojsonData)
        │
        ├─ new GeoJSONFormat({                    # REPROJECTION
        │     dataProjection: crs,
        │     featureProjection: 'EPSG:3857'
        │   })
        ├─ format.readFeatures(parsed)
        │
        ├─ new VectorSource({ features })
        ├─ new VectorLayer({ source, properties: { gisId } })
        ├─ olMap.addLayer(vecLayer)
        └─ olMap.getView().fit(sourceExtent)
```

## Layer Visibility Sync

When the user toggles visibility in the LayerList:

```
LayerList.handleToggle(id)
  │
  ├─ useLayersStore.toggleVisibility(id)     # Update store state
  │
  └─ getOlLayerByGisId(id)                   # Find OL layer
      └─ olLayer.setVisible(!current)        # Update map display
```

For opacity and color changes, the same pattern applies — store first, then sync to OL layer.

## Map Instance Lifecycle

```
MapPreview mounts
  │
  ├─ getMapInstance()?  No → new Map({ target: div, ... })
  │                            setMapInstance(map)
  │                            onMapReady?.(map)
  │
  ├─ getMapInstance()?  Yes → existing.setTarget(div)  # Reattach
  │                            existing.updateSize()
  │                            onMapReady?.(existing)
  │
  └─ Cleanup: map.setTarget(undefined)       # Detach from DOM only
               (does NOT destroy map instance)
```

The map singleton lives in `lib/mapRef.ts` and survives React StrictMode remounts and route navigation. This ensures layers persist when going back from the Layout Designer.
