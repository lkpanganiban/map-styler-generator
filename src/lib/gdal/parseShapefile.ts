import proj4 from 'proj4'
import type Map from 'ol/Map'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { register } from 'ol/proj/proj4'
import { registerProjection } from '@/lib/projection/proj4Defs'
import { useLayersStore } from '@/store/useLayersStore'

register(proj4)

export async function parseShapefile(
  files: File[],
  olMap: Map,
): Promise<{ id: string; crs: string }> {
  const shp = files.find((f) => f.name.endsWith('.shp'))
  if (!shp) throw new Error('No .shp file found')

  const dbf = files.find((f) => f.name.endsWith('.dbf'))
  const prj = files.find((f) => f.name.endsWith('.prj'))

  let crs = 'EPSG:4326'
  if (prj) {
    const prjText = await prj.text()
    const match = prjText.match(/EPSG[":\s]*(\d+)/i)
    if (match) {
      crs = `EPSG:${match[1]}`
    }
    ensureCrsRegistered(crs, prjText)
  }

  const result = await parseShapefileInternal(shp, dbf, crs)

  const store = useLayersStore.getState()
  const name = shp.name.replace(/\.shp$/i, '')
  const layer = store.addVector(name, crs, result.features.length, result.geojsonText)

  const source = new VectorSource({
    features: result.features,
  })

  const vecLayer = new VectorLayer({
    source,
    properties: { gisId: layer.id },
  })

  olMap.addLayer(vecLayer)

  const sourceExtent = source.getExtent()
  if (sourceExtent) {
    olMap.getView().fit(sourceExtent, { padding: [20, 20, 20, 20] })
  }

  return { id: layer.id, crs }
}

function ensureCrsRegistered(crs: string, prjText?: string) {
  if (proj4.defs(crs)) return
  if (prjText) {
    try {
      registerProjection(crs, prjText)
      return
    } catch {
      // fall through
    }
  }
  try {
    registerProjection(crs, `GEOGCS["${crs}"]`)
  } catch {
    // ignore
  }
}

async function parseShapefileInternal(shp: File, dbf?: File, crs = 'EPSG:4326') {
  const shpBuffer = await shp.arrayBuffer()

  if (!dbf) {
    return { features: [], crs, geojsonText: '{"type":"FeatureCollection","features":[]}' }
  }

  try {
    const shpjs = (await import('shpjs')).default
    const fc = await shpjs(shpBuffer)

    const format = new GeoJSONFormat({
      dataProjection: crs,
      featureProjection: 'EPSG:3857',
    })
    const features = format.readFeatures(fc)
    const geojsonText = JSON.stringify(fc)
    return { features, crs, geojsonText }
  } catch {
    return { features: [], crs, geojsonText: '{"type":"FeatureCollection","features":[]}' }
  }
}
