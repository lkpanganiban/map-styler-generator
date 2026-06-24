import { create } from 'zustand'
import type { RasterLayer, VectorLayer, LayerUnion, VectorStyle } from '@/types/layers'

let nextId = 1

function makeId(): string {
  return `layer-${nextId++}`
}

const defaultVectorStyle: VectorStyle = {
  fillColor: '#3b82f6',
  strokeColor: '#1d4ed8',
  strokeWidth: 1.5,
  pointRadius: 5,
}

interface LayersStore {
  layers: LayerUnion[]
  addRaster: (name: string, extent: [number, number, number, number], crs: string, bands: number, dataUrl?: string) => RasterLayer
  addVector: (name: string, crs: string, featureCount: number, geojsonData?: string) => VectorLayer
  removeLayer: (id: string) => void
  toggleVisibility: (id: string) => void
  setOpacity: (id: string, opacity: number) => void
  setVectorStyle: (id: string, style: Partial<VectorStyle>) => void
  reorder: (ids: string[]) => void
  clearAll: () => void
}

export const useLayersStore = create<LayersStore>((set) => ({
  layers: [],

  addRaster: (name, extent, crs, bands, dataUrl) => {
    const layer: RasterLayer = {
      id: makeId(),
      name,
      type: 'raster',
      visible: true,
      opacity: 1,
      extent,
      crs,
      bands,
      dataUrl,
    }
    set((s) => ({ layers: [...s.layers, layer] }))
    return layer
  },

  addVector: (name, crs, featureCount, geojsonData) => {
    const layer: VectorLayer = {
      id: makeId(),
      name,
      type: 'vector',
      visible: true,
      opacity: 1,
      crs,
      style: { ...defaultVectorStyle },
      featureCount,
      geojsonData,
    }
    set((s) => ({ layers: [...s.layers, layer] }))
    return layer
  },

  removeLayer: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),

  toggleVisibility: (id) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    })),

  setOpacity: (id, opacity) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
    })),

  setVectorStyle: (id, style) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id && l.type === 'vector'
          ? { ...l, style: { ...l.style, ...style } }
          : l,
      ),
    })),

  reorder: (ids) =>
    set((s) => ({
      layers: ids.map((id) => s.layers.find((l) => l.id === id)!).filter(Boolean),
    })),

  clearAll: () => set({ layers: [] }),
}))
