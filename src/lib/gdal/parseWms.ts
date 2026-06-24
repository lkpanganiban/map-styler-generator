import type Map from 'ol/Map'
import ImageLayer from 'ol/layer/Image'
import ImageWMS from 'ol/source/ImageWMS'
import { useLayersStore } from '@/store/useLayersStore'

export async function addWmsToMap(
  olMap: Map,
  name: string,
  serviceUrl: string,
  layerName: string,
  crs: string,
) {
  const defaultExtent: [number, number, number, number] = [
    -20037508.34, -20037508.34, 20037508.34, 20037508.34,
  ]

  const store = useLayersStore.getState()
  const layer = store.addWms(name, serviceUrl, layerName, crs, defaultExtent)

  const source = new ImageWMS({
    url: serviceUrl,
    params: {
      LAYERS: layerName,
      VERSION: '1.3.0',
      FORMAT: 'image/png',
      TRANSPARENT: true,
    },
    crossOrigin: 'anonymous',
    ratio: 1,
  })

  const imgLayer = new ImageLayer({
    source,
    properties: { gisId: layer.id },
    opacity: 1,
  })

  olMap.addLayer(imgLayer)

  source.once('imageloadend', () => {
    try {
      olMap.getView().fit(defaultExtent, { padding: [40, 40, 40, 40] })
    } catch { /* ignore */ }
  })

  return layer
}
