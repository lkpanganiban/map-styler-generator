import { fromArrayBuffer } from 'geotiff'
import proj4 from 'proj4'
import type Map from 'ol/Map'
import ImageLayer from 'ol/layer/Image'
import Static from 'ol/source/ImageStatic'
import Projection from 'ol/proj/Projection'
import { register } from 'ol/proj/proj4'
import { transformExtent } from 'ol/proj'
import { useLayersStore } from '@/store/useLayersStore'

register(proj4)

export async function parseGeoTIFF(
  file: File,
  olMap: Map,
): Promise<{ id: string; extent: [number, number, number, number]; crs: string }> {
  const buffer = await file.arrayBuffer()
  const tiff = await fromArrayBuffer(buffer)
  const image = await tiff.getImage()

  const bbox = image.getBoundingBox()

  const extent: [number, number, number, number] = [
    bbox[0],
    bbox[1],
    bbox[2],
    bbox[3],
  ]

  let crs = 'EPSG:4326'
  try {
    const geoKeys = image.getGeoKeys()
    if (geoKeys?.ProjectedCSTypeGeoKey) {
      crs = `EPSG:${geoKeys.ProjectedCSTypeGeoKey}`
    } else if (geoKeys?.GeographicTypeGeoKey) {
      crs = `EPSG:${geoKeys.GeographicTypeGeoKey}`
    }
  } catch {
    // no geo keys
  }

  const rasterData = await image.readRasters()
  const canvas = document.createElement('canvas')
  canvas.width = image.getWidth()
  canvas.height = image.getHeight()
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(canvas.width, canvas.height)

  const data = rasterData[0]
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i]
    if (data[i] > max) max = data[i]
  }
  const range = max - min || 1

  for (let i = 0; i < data.length; i++) {
    const val = Math.round(((data[i] - min) / range) * 255)
    imageData.data[i * 4] = val
    imageData.data[i * 4 + 1] = val
    imageData.data[i * 4 + 2] = val
    imageData.data[i * 4 + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)

  const dataUrl = canvas.toDataURL()

  const store = useLayersStore.getState()
  const layer = store.addRaster(file.name.replace(/\.(tif|tiff)$/i, ''), extent, crs, 1, dataUrl)

  let olExtent = extent
  if (crs !== 'EPSG:3857') {
    try {
      olExtent = transformExtent(extent, crs, 'EPSG:3857') as [number, number, number, number]
    } catch {
      try {
        const fromProj = proj4(crs, 'EPSG:3857')
        const ll = fromProj.forward([extent[0], extent[1]])
        const ur = fromProj.forward([extent[2], extent[3]])
        olExtent = [ll[0], ll[1], ur[0], ur[1]] as [number, number, number, number]
      } catch {
        // fall through with original extent
      }
    }
  }

  const proj3857 = new Projection({
    code: 'EPSG:3857',
    units: 'm',
  })

  const source = new Static({
    url: dataUrl,
    projection: proj3857,
    imageExtent: olExtent,
  })

  const imgLayer = new ImageLayer({
    source,
    properties: { gisId: layer.id },
    opacity: 1,
  })

  olMap.addLayer(imgLayer)
  olMap.getView().fit(olExtent, { padding: [20, 20, 20, 20] })

  return { id: layer.id, extent, crs }
}
