import type { FeatureCollection } from 'geojson'
import type Map from 'ol/Map'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { registerProjection } from '@/lib/projection/proj4Defs'
import { useLayersStore } from '@/store/useLayersStore'

register(proj4)

export async function parseGeoJSON(
  file: File,
  olMap: Map,
): Promise<{ id: string; name: string; crs: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const geojson: FeatureCollection = JSON.parse(text)
        let crs = (geojson as any).crs?.properties?.name ?? 'EPSG:4326'
        crs = normalizeCrs(crs)
        const name = file.name.replace(/\.geojson$/i, '').replace(/\.json$/i, '')

        ensureCrsRegistered(crs)

        const format = new GeoJSONFormat({
          dataProjection: crs,
          featureProjection: 'EPSG:3857',
        })
        const features = format.readFeatures(geojson)

        if (features.length === 0) {
          reject(new Error(`No features found in ${file.name}`))
          return
        }

        const store = useLayersStore.getState()
        const layer = store.addVector(name, crs, features.length, text)

        const source = new VectorSource({ features })
        const vecLayer = new VectorLayer({
          source,
          properties: { gisId: layer.id },
        })

        olMap.addLayer(vecLayer)

        const sourceExtent = source.getExtent()
        if (sourceExtent) {
          olMap.getView().fit(sourceExtent, { padding: [20, 20, 20, 20] })
        }

        resolve({ id: layer.id, name, crs })
      } catch (err: any) {
        reject(new Error(`Invalid GeoJSON file: ${file.name} — ${err?.message || ''}`))
      }
    }
    reader.onerror = () => reject(new Error(`Failed to read: ${file.name}`))
    reader.readAsText(file)
  })
}

function normalizeCrs(crs: string): string {
  if (/^EPSG:\d+$/i.test(crs)) return `EPSG:${crs.match(/\d+/)![0]}`
  if (crs === 'urn:ogc:def:crs:OGC:1.3:CRS84' || crs === 'CRS:84') return 'EPSG:4326'
  const digits = crs.match(/(\d{4,5})/g)
  if (digits) {
    const code = digits[digits.length - 1]
    return `EPSG:${code}`
  }
  return crs
}

function ensureCrsRegistered(crs: string) {
  if (proj4.defs(crs)) return
  if (crs === 'EPSG:4326' || crs === 'EPSG:3857') return
  const epsgMatch = crs.match(/(\d{4,5})/)
  if (epsgMatch) {
    const epsgCode = `EPSG:${epsgMatch[1]}`
    if (proj4.defs(epsgCode)) return
  }
  try {
    registerProjection(crs, `GEOGCS["${crs}"]`)
  } catch {
    // ignore
  }
}
