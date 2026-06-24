import { Group, Line, Rect, Text } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import type { ScaleBarElement, MapFrameElement } from '@/types/layout'

interface Props {
  element: ScaleBarElement
}

export function ScaleBarElementRenderer({ element }: Props) {
  const { selectedId, selectElement, updateElement, elements } = useLayoutStore()
  const isSelected = selectedId === element.id
  const pageScale = 2

  const segs = element.config.segments

  // Compute real-world distances from the linked map frame
  const mapFrame = elements.find(
    (el): el is MapFrameElement => el.kind === 'mapframe',
  )

  const { segmentValues, unitLabel, totalLabel } = computeScale(
    mapFrame,
    element,
    segs,
  )

  const x = element.x * pageScale
  const y = element.y * pageScale
  const w = element.width * pageScale
  const h = element.height * pageScale
  const segmentWidth = w / segs

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      x: e.target.x() / pageScale,
      y: e.target.y() / pageScale,
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
          y={-16}
          width={w + 4}
          height={h + 18}
          fill="transparent"
          stroke="#52525b"
          strokeWidth={1}
          dash={[2, 2]}
        />
      )}

      {/* Total scale label above */}
      {totalLabel && (
        <Text
          x={0}
          y={-h - 12}
          text={totalLabel}
          fontSize={element.config.fontSize}
          fontFamily={element.config.fontFamily}
          fontStyle="bold"
          fill={element.config.fontColor}
        />
      )}

      {/* Scale bar line */}
      <Line
        points={[0, 0, w, 0]}
        stroke={element.config.lineColor}
        strokeWidth={1.5}
      />

      {/* Tick marks */}
      {Array.from({ length: segs + 1 }).map((_, i) => (
        <Line
          key={i}
          points={[i * segmentWidth, 0, i * segmentWidth, h * 0.5]}
          stroke={element.config.lineColor}
          strokeWidth={1}
        />
      ))}

      {/* Alternating fill for bar style */}
      {element.config.barStyle === 'bar' &&
        Array.from({ length: segs }).map((_, i) => (
          <Rect
            key={i}
            x={i * segmentWidth}
            y={-h * 0.4}
            width={segmentWidth}
            height={h * 0.5}
            fill={i % 2 === 0 ? element.config.fillColor : 'transparent'}
            stroke={element.config.lineColor}
            strokeWidth={0.5}
          />
        ))}

      {/* Segment labels */}
      {element.config.barStyle === 'line'
        ? segmentValues.map((val, i) => (
            <Text
              key={i}
              x={i * segmentWidth + 2}
              y={h * 0.3}
              text={`${val}`}
              fontSize={element.config.fontSize}
              fontFamily={element.config.fontFamily}
              fill={element.config.fontColor}
            />
          ))
        : segmentValues.map((val, i) => (
            <Text
              key={i}
              x={i * segmentWidth + 2}
              y={h * 0.5 + 2}
              text={`${val}`}
              fontSize={element.config.fontSize}
              fontFamily={element.config.fontFamily}
              fill={element.config.fontColor}
            />
          ))}

      {/* Unit label at the end */}
      <Text
        x={w + 3}
        y={-2}
        text={unitLabel}
        fontSize={element.config.fontSize}
        fontFamily={element.config.fontFamily}
        fill={element.config.fontColor}
      />
    </Group>
  )
}

function computeScale(
  mapFrame: MapFrameElement | undefined,
  scaleBar: ScaleBarElement,
  segs: number,
) {
  if (!mapFrame || !mapFrame.extent) {
    return fallbackLabels(segs)
  }

  const [minX, , maxX] = mapFrame.extent
  const extentWidth = Math.abs(maxX - minX)
  const frameWidthMm = mapFrame.width

  if (extentWidth <= 0 || frameWidthMm <= 0) {
    return fallbackLabels(segs)
  }

  const groundUnitsPerMm = extentWidth / frameWidthMm
  const totalGround = groundUnitsPerMm * scaleBar.width
  const niceTotal = niceRound(totalGround)
  const segmentGround = niceTotal / segs

  let displayIncrement: number
  let unitLabel: string

  if (scaleBar.config.units === 'kilometers') {
    displayIncrement = segmentGround / 1000
    unitLabel = 'km'
  } else if (scaleBar.config.units === 'meters') {
    displayIncrement = segmentGround
    unitLabel = 'm'
  } else {
    // 'auto' — pick based on scale
    if (niceTotal >= 1000) {
      displayIncrement = segmentGround / 1000
      unitLabel = 'km'
    } else {
      displayIncrement = segmentGround
      unitLabel = 'm'
    }
  }

  const segmentValues = Array.from({ length: segs }, (_, i) => {
    const v = i * displayIncrement
    if (unitLabel === 'km' && v % 1 !== 0) {
      return v.toFixed(1)
    }
    return Math.round(v).toString()
  })

  const scaleDenom = 1 / (frameWidthMm / 1000 / extentWidth)
  const totalLabel = `1:${Math.round(scaleDenom).toLocaleString()}`

  return { segmentValues, unitLabel, totalLabel }
}

function fallbackLabels(segs: number) {
  return {
    segmentValues: Array.from({ length: segs }, (_, i) => (i * 10).toString()),
    unitLabel: 'm',
    totalLabel: null,
  }
}

function niceRound(value: number): number {
  if (value <= 0) return 1
  const exp = Math.floor(Math.log10(Math.abs(value)))
  const power = 10 ** exp

  const niceValues = [1, 2, 2.5, 5, 10]
  const candidates = niceValues.map((n) => n * power)
  candidates.unshift(power / 2)
  candidates.push(power * 10)

  let best = candidates[0]
  for (const c of candidates) {
    if (c <= value * 1.3 && c > best) {
      best = c
    }
  }
  return best
}
