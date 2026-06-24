import { useRef } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import { PAPER_SIZES_MM, getPageDimensions } from '@/types/layout'
import type { LayoutElement } from '@/types/layout'
import { MapFrameElement } from './elements/MapFrameElement'
import { NorthArrowElement } from './elements/NorthArrowElement'
import { ScaleBarElementRenderer } from './elements/ScaleBarElement'
import { LegendElementRenderer } from './elements/LegendElement'
import { LogoElement } from './elements/LogoElement'
import { TextElementRenderer } from './elements/TextElement'

interface LayoutCanvasProps {
  stageRef: React.MutableRefObject<any>
}

export function LayoutCanvas({ stageRef }: LayoutCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { elements, pageConfig, selectElement } = useLayoutStore()

  const dims = getPageDimensions(
    PAPER_SIZES_MM[pageConfig.paperSize],
    pageConfig.orientation,
  )

  const pageW = dims.widthMm
  const pageH = dims.heightMm

  const scale = 2
  const canvasW = pageW * scale
  const canvasH = pageH * scale

  const renderElement = (el: LayoutElement) => {
    switch (el.kind) {
      case 'mapframe':
        return <MapFrameElement key={el.id} element={el} scale={scale} />
      case 'northarrow':
        return <NorthArrowElement key={el.id} element={el} />
      case 'scalebar':
        return <ScaleBarElementRenderer key={el.id} element={el} />
      case 'legend':
        return <LegendElementRenderer key={el.id} element={el} />
      case 'logo':
        return <LogoElement key={el.id} element={el} />
      case 'text':
        return <TextElementRenderer key={el.id} element={el} />
      default:
        return null
    }
  }

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      selectElement(null)
    }
  }

  return (
    <div ref={containerRef} className="flex items-center justify-center">
      <Stage
        ref={stageRef}
        width={canvasW}
        height={canvasH}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={canvasW}
            height={canvasH}
            fill="#ffffff"
            stroke="#d4d4d8"
            strokeWidth={0.5}
          />

          <Rect
            x={pageConfig.margins.left * scale}
            y={pageConfig.margins.top * scale}
            width={pageW * scale - (pageConfig.margins.left + pageConfig.margins.right) * scale}
            height={pageH * scale - (pageConfig.margins.top + pageConfig.margins.bottom) * scale}
            fill="transparent"
            stroke="#e4e4e7"
            strokeWidth={0.5}
            dash={[4, 4]}
          />

          {elements.map(renderElement)}
        </Layer>
      </Stage>
    </div>
  )
}
