export type LayerType = 'raster' | 'vector'

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

export type LayerUnion = RasterLayer | VectorLayer
