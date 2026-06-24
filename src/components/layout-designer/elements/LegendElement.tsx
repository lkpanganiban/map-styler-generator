import { Group, Rect, Text, Line } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useLayersStore } from '@/store/useLayersStore'
import type { LegendElement } from '@/types/layout'

interface Props {
  element: LegendElement
  scale: number
  onTransformEnd: (e: any) => void
}

export function LegendElementRenderer({ element, scale, onTransformEnd }: Props) {
  const { selectedId, selectElement, updateElement } = useLayoutStore()
  const layers = useLayersStore((s) => s.layers)
  const isSelected = selectedId === element.id

  const x = element.x * scale
  const y = element.y * scale
  const config = element.config
  const visibleLayers = layers.filter((l) => l.visible)

  const rowH = 16
  const titleH = config.title ? 18 : 0
  const totalH = titleH + visibleLayers.length * rowH
  const w = 120

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      x: e.target.x() / scale,
      y: e.target.y() / scale,
    } as any)
  }

  return (
    <Group
      id={element.id}
      x={x}
      y={y}
      width={w}
      height={Math.max(totalH, 10)}
      rotation={element.rotation || 0}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={onTransformEnd}
      onClick={() => selectElement(element.id)}
      onTap={() => selectElement(element.id)}
    >
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={w + 4}
          height={totalH + 4}
          fill="transparent"
          stroke="#52525b"
          strokeWidth={1}
          dash={[2, 2]}
        />
      )}

      <Text
        x={0}
        y={0}
        text={config.title}
        fontSize={config.fontSize + 2}
        fontFamily={config.fontFamily}
        fontStyle="bold"
        fill={config.fontColor}
        visible={!!config.title}
      />

      {visibleLayers.map((layer, i) => (
        <Group key={layer.id} y={titleH + i * rowH}>
          <Rect
            x={0}
            y={2}
            width={config.patchWidth}
            height={config.patchHeight}
            fill={layer.type === 'raster' ? '#a1a1aa' : (layer as any).style?.fillColor || '#3b82f6'}
            stroke={layer.type === 'vector' ? ((layer as any).style?.strokeColor || '#1d4ed8') : '#71717a'}
            strokeWidth={1}
          />
          <Line
            points={[0, 2 + config.patchHeight / 2, config.patchWidth, 2 + config.patchHeight / 2]}
            stroke={(layer as any).style?.strokeColor || '#1d4ed8'}
            strokeWidth={1}
            visible={layer.type === 'vector'}
          />
          <Text
            x={config.patchWidth + 6}
            y={1}
            text={layer.name}
            fontSize={config.fontSize}
            fontFamily={config.fontFamily}
            fill={config.fontColor}
          />
        </Group>
      ))}

      {visibleLayers.length === 0 && (
        <Text
          x={0}
          y={titleH}
          text="No layers loaded"
          fontSize={config.fontSize}
          fontFamily={config.fontFamily}
          fill="#a1a1aa"
        />
      )}
    </Group>
  )
}
