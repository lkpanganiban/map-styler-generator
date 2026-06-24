import { useLayersStore } from '@/store/useLayersStore'
import { getMapInstance, getOlLayerByGisId } from '@/lib/mapRef'
import { Eye, EyeOff, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style'

export function LayerList() {
  const { layers, toggleVisibility, removeLayer, setOpacity, setVectorStyle } = useLayersStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    const layer = layers.find((l) => l.id === id)
    const currentlyVisible = layer?.visible ?? true
    toggleVisibility(id)
    const olLayer = getOlLayerByGisId(id)
    if (olLayer) {
      olLayer.setVisible(!currentlyVisible)
    }
  }

  const handleRemove = (id: string) => {
    removeLayer(id)
    const map = getMapInstance()
    if (map) {
      const olLayer = getOlLayerByGisId(id)
      if (olLayer) {
        map.removeLayer(olLayer)
      }
    }
  }

  const handleOpacity = (id: string, opacity: number) => {
    setOpacity(id, opacity)
    const olLayer = getOlLayerByGisId(id)
    if (olLayer) {
      olLayer.setOpacity(opacity)
    }
  }

  const applyOlStyle = (id: string, fillColor: string, strokeColor: string, strokeWidth: number, pointRadius: number) => {
    const olLayer = getOlLayerByGisId(id)
    if (!olLayer) return
    const style = new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      image: new CircleStyle({
        radius: pointRadius,
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      }),
    })
    olLayer.setStyle(style)
  }

  const handleColorChange = (id: string, prop: string, value: string) => {
    const layer = layers.find((l) => l.id === id) as any
    if (!layer) return
    const newStyle = { ...layer.style, [prop]: value }
    setVectorStyle(id, { [prop]: value } as any)
    applyOlStyle(id, newStyle.fillColor, newStyle.strokeColor, newStyle.strokeWidth, newStyle.pointRadius)
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-50/80 border-b border-zinc-200">
        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
          Layers ({layers.length})
        </span>
      </div>

      {layers.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-zinc-400">
          No layers loaded. Drag files or click "Add Layer".
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {[...layers].reverse().map((layer) => (
            <div
              key={layer.id}
              className="flex flex-col border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                {layer.type === 'vector' && (
                  <button
                    onClick={() => setExpandedId(expandedId === layer.id ? null : layer.id)}
                    className="text-zinc-400 hover:text-zinc-600 shrink-0"
                  >
                    {expandedId === layer.id ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
                <div
                  className={clsx(
                    'w-3 h-3 rounded-sm flex-shrink-0 border',
                    layer.type === 'raster' ? 'bg-zinc-300' : 'bg-blue-400',
                  )}
                  style={
                    layer.type === 'vector'
                      ? { backgroundColor: (layer as any).style?.fillColor || '#3b82f6' }
                      : undefined
                  }
                />
                <span className="flex-1 text-xs text-zinc-700 truncate">{layer.name}</span>
                <span className="text-[10px] text-zinc-400 uppercase shrink-0">{layer.type}</span>
                <button
                  onClick={() => handleToggle(layer.id)}
                  className="text-zinc-400 hover:text-zinc-600 shrink-0"
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleRemove(layer.id)}
                  className="text-zinc-400 hover:text-red-500 shrink-0"
                  title="Remove layer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {layer.visible && (
                <div className="px-3 pb-2 ml-5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-8 shrink-0">Opacity</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={layer.opacity}
                      onChange={(e) => handleOpacity(layer.id, Number(e.target.value))}
                      className="flex-1 h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-600"
                    />
                    <span className="text-[10px] text-zinc-400 w-7 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>

                  {layer.type === 'vector' && expandedId === layer.id && (
                    <div className="space-y-1.5 pt-1 border-t border-zinc-200">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 w-8 shrink-0">Fill</span>
                        <input
                          type="color"
                          value={(layer as any).style.fillColor}
                          onChange={(e) => handleColorChange(layer.id, 'fillColor', e.target.value)}
                          className="w-6 h-5 rounded border border-zinc-300 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={(layer as any).style.fillColor}
                          onChange={(e) => handleColorChange(layer.id, 'fillColor', e.target.value)}
                          className="flex-1 h-5 rounded border border-zinc-300 px-1.5 text-[10px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 w-8 shrink-0">Stroke</span>
                        <input
                          type="color"
                          value={(layer as any).style.strokeColor}
                          onChange={(e) => handleColorChange(layer.id, 'strokeColor', e.target.value)}
                          className="w-6 h-5 rounded border border-zinc-300 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={(layer as any).style.strokeColor}
                          onChange={(e) => handleColorChange(layer.id, 'strokeColor', e.target.value)}
                          className="flex-1 h-5 rounded border border-zinc-300 px-1.5 text-[10px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
