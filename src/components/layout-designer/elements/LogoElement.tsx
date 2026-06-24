import { useState, useEffect } from 'react'
import { Group, Rect, Image as KonvaImage } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import type { LogoElement } from '@/types/layout'

interface Props {
  element: LogoElement
}

export function LogoElement({ element }: Props) {
  const { selectedId, selectElement, updateElement } = useLayoutStore()
  const isSelected = selectedId === element.id
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const scale = 2

  useEffect(() => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => setImg(image)
    image.src = element.imageDataUrl
  }, [element.imageDataUrl])

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
      x={x}
      y={y}
      draggable
      onDragEnd={handleDragEnd}
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
      {img ? (
        <KonvaImage image={img} width={w} height={h} />
      ) : (
        <Rect width={w} height={h} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth={1} />
      )}
    </Group>
  )
}
