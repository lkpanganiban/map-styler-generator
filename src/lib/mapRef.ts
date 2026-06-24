import type Map from 'ol/Map'

let mapInstance: Map | null = null

export function setMapInstance(map: Map | null) {
  mapInstance = map
}

export function getMapInstance(): Map | null {
  return mapInstance
}

export function getOlLayerByGisId(gisId: string): any {
  if (!mapInstance) return undefined
  return mapInstance
    .getLayers()
    .getArray()
    .find((l: any) => l.get('gisId') === gisId)
}

export function getCombinedVisibleExtent(): [number, number, number, number] | null {
  if (!mapInstance) return null
  const layers = mapInstance.getLayers().getArray()
  let combined: [number, number, number, number] | null = null

  for (const layer of layers) {
    const gisId = layer.get('gisId')
    if (!gisId) continue
    try {
      const source = (layer as any).getSource?.()
      if (!source) continue
      const ext = source.getExtent?.()
      if (!ext) continue
      if (!combined) {
        combined = [...ext] as [number, number, number, number]
      } else {
        combined[0] = Math.min(combined[0], ext[0])
        combined[1] = Math.min(combined[1], ext[1])
        combined[2] = Math.max(combined[2], ext[2])
        combined[3] = Math.max(combined[3], ext[3])
      }
    } catch {
      // skip
    }
  }

  return combined
}
