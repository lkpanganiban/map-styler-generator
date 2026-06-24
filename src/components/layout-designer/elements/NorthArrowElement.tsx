import { Group, Path } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import { northArrowPresets } from '@/lib/icons/northArrows'
import type { NorthArrowElement } from '@/types/layout'

interface Props {
  element: NorthArrowElement
}

export function NorthArrowElement({ element }: Props) {
  const { selectedId, selectElement, updateElement } = useLayoutStore()
  const isSelected = selectedId === element.id
  const scale = 2

  const pathData = northArrowPresets[element.preset] || northArrowPresets.arrow1

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      x: e.target.x() / scale,
      y: e.target.y() / scale,
    } as any)
  }

  return (
    <Group
      x={element.x * scale}
      y={element.y * scale}
      draggable
      onDragEnd={handleDragEnd}
      onClick={() => selectElement(element.id)}
      onTap={() => selectElement(element.id)}
      rotation={element.rotation || 0}
    >
      <Path
        data={pathData}
        fill={element.fillColor}
        stroke={element.strokeColor}
        strokeWidth={1}
        width={element.width * scale}
        height={element.height * scale}
        scaleX={(element.width * scale) / 20}
        scaleY={(element.height * scale) / 32}
      />
      {isSelected && (
        <Path
          data={pathData}
          fill="transparent"
          stroke="#52525b"
          strokeWidth={2}
          width={element.width * scale}
          height={element.height * scale}
          scaleX={(element.width * scale) / 20}
          scaleY={(element.height * scale) / 32}
        />
      )}
    </Group>
  )
}
