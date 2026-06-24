export type LayerType = 'raster' | 'vector' | 'wms' | 'wfs'

export interface BaseLayer {
  id: string
  name: string
  type: LayerType
  visible: boolean
  opacity: number
}

export interface RasterLayer extends BaseLayer {
  type: 'raster'
  extent: [number, number, number, number]
  crs: string
  bands: number
  dataUrl?: string
}

export interface WmsLayer extends BaseLayer {
  type: 'wms'
  serviceUrl: string
  layerName: string
  crs: string
  extent: [number, number, number, number]
}

export interface VectorStyle {
  fillColor: string
  strokeColor: string
  strokeWidth: number
  pointRadius: number
}

export interface VectorLayer extends BaseLayer {
  type: 'vector'
  crs: string
  style: VectorStyle
  featureCount: number
  features?: unknown
  geojsonData?: string
}

export interface WfsLayer extends BaseLayer {
  type: 'wfs'
  serviceUrl: string
  typename: string
  crs: string
  style: VectorStyle
  geojsonData?: string
}

export type LayerUnion = RasterLayer | VectorLayer | WmsLayer | WfsLayer
