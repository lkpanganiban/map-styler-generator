export type ElementKind = 'mapframe' | 'northarrow' | 'scalebar' | 'legend' | 'logo' | 'text' | 'techdesc'

export interface GridConfig {
  enabled: boolean
  spacingX: number
  spacingY: number
  lineColor: string
  lineWidth: number
  lineStyle: 'solid' | 'dashed'
  labelPosition: 'none' | 'inside' | 'outside'
  labelFontSize: number
  labelFormat: 'decimal' | 'dms'
  labelColor: string
}

export interface BaseElement {
  id: string
  kind: ElementKind
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
}

export interface MapFrameElement extends BaseElement {
  kind: 'mapframe'
  extent: [number, number, number, number]
  gridConfig: GridConfig
}

export interface NorthArrowElement extends BaseElement {
  kind: 'northarrow'
  angle: number
  preset: string
  fillColor: string
  strokeColor: string
}

export interface ScaleBarConfig {
  segments: number
  units: 'auto' | 'meters' | 'kilometers'
  barStyle: 'line' | 'bar'
  fontFamily: string
  fontSize: number
  fontColor: string
  lineColor: string
  fillColor: string
  segmentWidthMm: number
}

export interface ScaleBarElement extends BaseElement {
  kind: 'scalebar'
  config: ScaleBarConfig
  linkedMapFrameId: string
}

export interface LegendConfig {
  title: string
  fontFamily: string
  fontSize: number
  fontColor: string
  columns: number
  patchWidth: number
  patchHeight: number
  items: LegendItem[]
}

export interface LegendItem {
  label: string
  visible: boolean
  fillColor: string
  strokeColor: string
  strokeWidth: number
}

export interface LegendElement extends BaseElement {
  kind: 'legend'
  config: LegendConfig
}

export interface TechnicalDescriptionConfig {
  title: string
  fontFamily: string
  fontSize: number
  fontColor: string
  borderColor: string
  borderWidth: number
  rows: string[][]
}

export interface TechnicalDescriptionElement extends BaseElement {
  kind: 'techdesc'
  config: TechnicalDescriptionConfig
}

export interface LogoElement extends BaseElement {
  kind: 'logo'
  imageDataUrl: string
  lockedAspect: boolean
}

export interface TextElement extends BaseElement {
  kind: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontColor: string
  bold: boolean
  italic: boolean
  alignment: 'left' | 'center' | 'right'
  backgroundColor: string
  borderColor: string
  borderWidth: number
}

export type LayoutElement =
  | MapFrameElement
  | NorthArrowElement
  | ScaleBarElement
  | LegendElement
  | TechnicalDescriptionElement
  | LogoElement
  | TextElement

export type PageOrientation = 'portrait' | 'landscape'

export type PaperSize = 'A4' | 'A3' | 'Letter'

export interface PageConfig {
  paperSize: PaperSize
  customWidthMm: number
  customHeightMm: number
  orientation: PageOrientation
  dpi: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface LayoutState {
  pageConfig: PageConfig
  elements: LayoutElement[]
  selectedId: string | null
  undoStack: LayoutSnapshot[]
  redoStack: LayoutSnapshot[]

  addElement: (element: LayoutElement) => void
  updateElement: (id: string, patch: Partial<LayoutElement>) => void
  removeElement: (id: string) => void
  removeSelected: () => void
  selectElement: (id: string | null) => void
  setPageConfig: (config: Partial<PageConfig>) => void
  undo: () => void
  redo: () => void
  setElements: (elements: LayoutElement[]) => void
  loadTemplate: (pageConfig: PageConfig, elements: LayoutElement[]) => void
  getMapFrame: () => MapFrameElement | undefined
}

export interface LayoutSnapshot {
  elements: LayoutElement[]
  pageConfig: PageConfig
}

export const PAPER_SIZES_MM: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 215.9, height: 279.4 },
}

export function getPageDimensions(mm: { width: number; height: number }, orientation: PageOrientation) {
  if (orientation === 'landscape') {
    return { widthMm: mm.height, heightMm: mm.width }
  }
  return { widthMm: mm.width, heightMm: mm.height }
}
