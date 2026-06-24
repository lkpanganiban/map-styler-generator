import { Group, Rect, Text } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import type { TechnicalDescriptionElement } from '@/types/layout'

interface Props {
  element: TechnicalDescriptionElement
  scale: number
  onTransformEnd: (e: any) => void
}

export function TechnicalDescriptionElementRenderer({ element, scale, onTransformEnd }: Props) {
  const { selectedId, selectElement, updateElement } = useLayoutStore()
  const isSelected = selectedId === element.id

  const x = element.x * scale
  const y = element.y * scale
  const config = element.config

  const visibleItems = config.items.filter((item) => item.visible)
  const columns = Math.max(1, config.columns)
  const rowH = 16
  const titleH = config.title ? 20 : 0
  const padding = 4
  const columnGap = 12
  const itemsPerColumn = Math.ceil(visibleItems.length / columns)
  const rowsPerColumn = Math.max(1, itemsPerColumn)
  const renderedH = titleH + rowsPerColumn * rowH + padding * 2
  const labelWidth = 50

  const columnWidth = (element.width * scale - padding * 2 - columnGap * (columns - 1)) / columns
  const w = element.width * scale
  const h = Math.max(renderedH, element.height * scale)

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      x: e.target.x() / scale,
      y: e.target.y() / scale,
    } as any)
  }

  const items = visibleItems

  return (
    <Group
      id={element.id}
      x={x}
      y={y}
      width={w}
      height={h}
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
          height={h + 4}
          fill="transparent"
          stroke="#52525b"
          strokeWidth={1}
          dash={[2, 2]}
        />
      )}

      {config.title && (
        <Text
          x={padding}
          y={padding}
          text={config.title}
          fontSize={config.fontSize + 2}
          fontFamily={config.fontFamily}
          fontStyle="bold"
          fill={config.fontColor}
          width={w - padding * 2}
        />
      )}

      {Array.from({ length: columns }, (_, col) => {
        const colItems = items.slice(col * itemsPerColumn, (col + 1) * itemsPerColumn)
        const colX = padding + col * (columnWidth + columnGap)
        return (
          <Group key={col}>
            {colItems.map((item, i) => (
              <Group key={i} y={titleH + padding + i * rowH}>
                <Text
                  x={colX}
                  y={0}
                  text={item.label}
                  fontSize={config.fontSize}
                  fontFamily={config.fontFamily}
                  fontStyle="bold"
                  fill={config.labelColor}
                  width={labelWidth}
                />
                <Text
                  x={colX + labelWidth + 2}
                  y={0}
                  text={item.value}
                  fontSize={config.fontSize}
                  fontFamily={config.fontFamily}
                  fill={config.valueColor}
                />
              </Group>
            ))}
          </Group>
        )
      })}

      {visibleItems.length === 0 && (
        <Text
          x={padding}
          y={titleH + padding}
          text="No items"
          fontSize={config.fontSize}
          fontFamily={config.fontFamily}
          fill="#a1a1aa"
        />
      )}
    </Group>
  )
}
