import { useEffect, useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import { useLayoutStore } from '@/store/useLayoutStore'
import { PAPER_SIZES_MM, getPageDimensions } from '@/types/layout'
import type { LayoutElement } from '@/types/layout'
import { MapFrameElement } from './elements/MapFrameElement'
import { NorthArrowElement } from './elements/NorthArrowElement'
import { ScaleBarElementRenderer } from './elements/ScaleBarElement'
import { LegendElementRenderer } from './elements/LegendElement'
import { LogoElement } from './elements/LogoElement'
import { TextElementRenderer } from './elements/TextElement'
import { TechnicalDescriptionElementRenderer } from './elements/TechnicalDescriptionElement'

interface LayoutCanvasProps {
  stageRef: React.MutableRefObject<any>
  availableWidth: number
}

export function LayoutCanvas({ stageRef, availableWidth }: LayoutCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<any>(null)
  const { elements, pageConfig, selectElement, selectedId, updateElement } = useLayoutStore()

  const dims = getPageDimensions(
    PAPER_SIZES_MM[pageConfig.paperSize],
    pageConfig.orientation,
  )

  const pageW = dims.widthMm
  const pageH = dims.heightMm

  const PADDING = 40
  const maxScale = 2
  const minScale = 0.5

  const scale = availableWidth > 0
    ? Math.max(minScale, Math.min(maxScale, (availableWidth - PADDING) / pageW))
    : maxScale

  const canvasW = pageW * scale
  const canvasH = pageH * scale

  const handleTransformEnd = useCallback((e: any) => {
    const node = e.target
    const elementId = node.id()
    if (!elementId) return

    const element = elements.find((el) => el.id === elementId)
    if (!element) return

    const sx = node.scaleX()
    const sy = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)

    updateElement(elementId, {
      x: node.x() / scale,
      y: node.y() / scale,
      width: Math.max(5, node.width() * sx) / scale,
      height: Math.max(5, node.height() * sy) / scale,
      rotation: node.rotation(),
    } as any)
  }, [elements, scale, updateElement])

  useEffect(() => {
    if (!transformerRef.current) return
    const stage = transformerRef.current.getStage()
    if (!stage) return

    if (selectedId) {
      const node = stage.findOne(`#${selectedId}`)
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer()?.batchDraw()
        return
      }
    }
    transformerRef.current.nodes([])
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedId])

  const getTransformerConfig = () => {
    const el = elements.find((e) => e.id === selectedId)
    if (el?.kind === 'logo' && (el as any).lockedAspect) {
      return { keepRatio: true }
    }
    return {}
  }

  const renderElement = (el: LayoutElement) => {
    switch (el.kind) {
      case 'mapframe':
        return <MapFrameElement key={el.id} element={el} scale={scale} onTransformEnd={handleTransformEnd} />
      case 'northarrow':
        return <NorthArrowElement key={el.id} element={el} scale={scale} onTransformEnd={handleTransformEnd} />
      case 'scalebar':
        return <ScaleBarElementRenderer key={el.id} element={el} scale={scale} onTransformEnd={handleTransformEnd} />
      case 'legend':
        return <LegendElementRenderer key={el.id} element={el} scale={scale} onTransformEnd={handleTransformEnd} />
      case 'logo':
        return <LogoElement key={el.id} element={el} scale={scale} onTransformEnd={handleTransformEnd} />
      case 'text':
        return <TextElementRenderer key={el.id} element={el} scale={scale} onTransformEnd={handleTransformEnd} />
      case 'techdesc':
        return <TechnicalDescriptionElementRenderer key={el.id} element={el} scale={scale} onTransformEnd={handleTransformEnd} />
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
    <div ref={containerRef} className="flex items-center justify-center min-h-0">
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
          {selectedId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) return oldBox
                return newBox
              }}
              {...getTransformerConfig()}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
