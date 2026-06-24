import { Group, Rect, Text } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import type { TextElement } from '@/types/layout'

interface Props {
  element: TextElement
  scale: number
  onTransformEnd: (e: any) => void
}

export function TextElementRenderer({ element, scale, onTransformEnd }: Props) {
  const { selectedId, selectElement, updateElement } = useLayoutStore()
  const isSelected = selectedId === element.id

  const x = element.x * scale
  const y = element.y * scale
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
      {element.backgroundColor !== 'transparent' && (
        <Rect
          width={w}
          height={h}
          fill={element.backgroundColor}
          stroke={element.borderColor}
          strokeWidth={element.borderWidth}
        />
      )}
      <Text
        x={element.alignment === 'center' ? w / 2 : element.alignment === 'right' ? w - 4 : 4}
        y={4}
        text={element.text}
        fontSize={element.fontSize * scale}
        fontFamily={element.fontFamily}
        fontStyle={`${element.bold ? 'bold' : ''} ${element.italic ? 'italic' : ''}`.trim() || 'normal'}
        fill={element.fontColor}
        align={element.alignment}
        width={w - 8}
      />
    </Group>
  )
}
