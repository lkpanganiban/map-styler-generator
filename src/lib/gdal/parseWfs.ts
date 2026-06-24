import type Map from 'ol/Map'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { useLayersStore } from '@/store/useLayersStore'

register(proj4)

export async function addWfsToMap(
  olMap: Map,
  name: string,
  serviceUrl: string,
  typename: string,
  crs: string,
) {
  const urlObj = new URL(serviceUrl)
  urlObj.searchParams.set('service', 'WFS')
  urlObj.searchParams.set('version', '2.0.0')
  urlObj.searchParams.set('request', 'GetFeature')
  urlObj.searchParams.set('typeNames', typename)
  urlObj.searchParams.set('outputFormat', 'application/json')
  urlObj.searchParams.set('srsName', crs || 'EPSG:4326')

  let geojsonData: string | undefined

  try {
    const response = await fetch(urlObj.toString())
    geojsonData = await response.text()
    JSON.parse(geojsonData)
  } catch {
    // WFS fetch may fail; layer will still be registered but with no features
  }

  const store = useLayersStore.getState()
  const layer = store.addWfs(name, serviceUrl, typename, crs, geojsonData)

  if (!geojsonData) {
    olMap.getView().fit([-200, -80, 200, 80], { padding: [40, 40, 40, 40] })
    return layer
  }

  const format = new GeoJSONFormat({
    dataProjection: crs,
    featureProjection: 'EPSG:3857',
  })

  let features: any[] = []
  try {
    features = format.readFeatures(JSON.parse(geojsonData))
  } catch {
    features = []
  }

  const source = new VectorSource({ features })
  const vecLayer = new VectorLayer({
    source,
    properties: { gisId: layer.id },
  })

  olMap.addLayer(vecLayer)

  const sourceExtent = source.getExtent()
  if (sourceExtent) {
    olMap.getView().fit(sourceExtent, { padding: [40, 40, 40, 40] })
  }

  return layer
}
