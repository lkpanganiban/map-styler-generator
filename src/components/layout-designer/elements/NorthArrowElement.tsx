import { Group, Path } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import { northArrowPresets } from '@/lib/icons/northArrows'
import type { NorthArrowElement } from '@/types/layout'

interface Props {
  element: NorthArrowElement
  scale: number
  onTransformEnd: (e: any) => void
}

export function NorthArrowElement({ element, scale, onTransformEnd }: Props) {
  const { selectedId, selectElement, updateElement } = useLayoutStore()
  const isSelected = selectedId === element.id

  const pathData = northArrowPresets[element.preset] || northArrowPresets.arrow1
  const w = element.width * scale
  const h = element.height * scale

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      x: e.target.x() / scale,
      y: e.target.y() / scale,
    } as any)
  }

  return (
    <Group
      id={element.id}
      x={element.x * scale}
      y={element.y * scale}
      width={w}
      height={h}
      rotation={element.rotation || 0}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={onTransformEnd}
      onClick={() => selectElement(element.id)}
      onTap={() => selectElement(element.id)}
    >
      <Path
        data={pathData}
        fill={element.fillColor}
        stroke={element.strokeColor}
        strokeWidth={1}
        width={w}
        height={h}
        scaleX={w / 20}
        scaleY={h / 32}
      />
      {isSelected && (
        <Path
          data={pathData}
          fill="transparent"
          stroke="#52525b"
          strokeWidth={2}
          width={w}
          height={h}
          scaleX={w / 20}
          scaleY={h / 32}
        />
      )}
    </Group>
  )
}
