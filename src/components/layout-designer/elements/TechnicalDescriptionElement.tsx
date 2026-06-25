import { Group, Rect, Text, Line } from 'react-konva'
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

  const padding = 4
  const titleH = config.title ? 20 : 0
  const rowH = Math.max(config.fontSize + 6, 12)

  const rows = config.rows.length > 0 ? config.rows : [[]]
  const colCount = Math.max(1, ...rows.map((r) => r.length))

  const tableW = Math.max(0, element.width * scale - padding * 2)
  const colW = colCount > 0 ? tableW / colCount : tableW
  const renderedH = titleH + rows.length * rowH + padding * 2
  const w = element.width * scale
  const h = Math.max(renderedH, element.height * scale)

  const tableTop = titleH + padding

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      x: e.target.x() / scale,
      y: e.target.y() / scale,
    } as any)
  }

  const paddedRows = rows.map((row) => {
    const cells = [...row]
    while (cells.length < colCount) cells.push('')
    return cells
  })

  const verticalLines: number[][] = []
  for (let c = 0; c <= colCount; c++) {
    const lx = padding + c * colW
    verticalLines.push([lx, tableTop, lx, tableTop + rows.length * rowH])
  }

  const horizontalLines: number[][] = []
  for (let r = 0; r <= rows.length; r++) {
    const ly = tableTop + r * rowH
    horizontalLines.push([padding, ly, padding + tableW, ly])
  }

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

      {paddedRows.map((row, r) =>
        row.map((cell, c) => (
          <Text
            key={`${r}-${c}`}
            x={padding + c * colW + 4}
            y={tableTop + r * rowH + (rowH - config.fontSize) / 2}
            text={cell}
            fontSize={config.fontSize}
            fontFamily={config.fontFamily}
            fill={config.fontColor}
            width={Math.max(0, colW - 8)}
          />
        )),
      )}

      {verticalLines.map((pts, i) => (
        <Line
          key={`v-${i}`}
          points={pts}
          stroke={config.borderColor}
          strokeWidth={config.borderWidth}
        />
      ))}

      {horizontalLines.map((pts, i) => (
        <Line
          key={`h-${i}`}
          points={pts}
          stroke={config.borderColor}
          strokeWidth={config.borderWidth}
        />
      ))}

      {rows.length === 0 && (
        <Text
          x={padding}
          y={tableTop + padding}
          text="No data"
          fontSize={config.fontSize}
          fontFamily={config.fontFamily}
          fill="#a1a1aa"
        />
      )}
    </Group>
  )
}
