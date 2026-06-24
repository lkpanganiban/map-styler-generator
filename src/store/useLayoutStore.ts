import { create } from 'zustand'
import type {
  LayoutElement,
  LayoutState,
  LayoutSnapshot,
  PageConfig,
  MapFrameElement,
  GridConfig,
  NorthArrowElement,
  ScaleBarElement,
  LegendElement,
  TextElement,
} from '@/types/layout'
import { PAPER_SIZES_MM, getPageDimensions } from '@/types/layout'

let nextElementId = 1
function makeElementId(): string {
  return `elem-${nextElementId++}`
}

const DEFAULT_PAGE: PageConfig = {
  paperSize: 'A4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'landscape',
  dpi: 150,
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
}

const DEFAULT_GRID: GridConfig = {
  enabled: false,
  spacingX: 10,
  spacingY: 10,
  lineColor: '#d4d4d8',
  lineWidth: 0.5,
  lineStyle: 'solid',
  labelPosition: 'none',
  labelFontSize: 8,
  labelFormat: 'decimal',
  labelColor: '#52525b',
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  pageConfig: { ...DEFAULT_PAGE },
  elements: [],
  selectedId: null,
  undoStack: [],
  redoStack: [],

  addElement: (element) => {
    const snap = snapshot(get())
    set((s) => ({
      elements: [...s.elements, element],
      undoStack: [...s.undoStack, snap],
      redoStack: [],
      selectedId: element.id,
    }))
  },

  updateElement: (id, patch) => {
    const snap = snapshot(get())
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, ...patch } as LayoutElement : el)),
      undoStack: [...s.undoStack, snap],
      redoStack: [],
    }))
  },

  removeElement: (id) => {
    const snap = snapshot(get())
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      undoStack: [...s.undoStack, snap],
      redoStack: [],
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  removeSelected: () => {
    const { selectedId } = get()
    if (selectedId) get().removeElement(selectedId)
  },

  selectElement: (id) => set({ selectedId: id }),

  setPageConfig: (config) =>
    set((s) => ({ pageConfig: { ...s.pageConfig, ...config } })),

  undo: () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    const snap = snapshot(get())
    set({
      elements: prev.elements,
      pageConfig: prev.pageConfig,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, snap],
      selectedId: null,
    })
  },

  redo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    const snap = snapshot(get())
    set({
      elements: next.elements,
      pageConfig: next.pageConfig,
      undoStack: [...get().undoStack, snap],
      redoStack: redoStack.slice(0, -1),
      selectedId: null,
    })
  },

  setElements: (elements) => set({ elements }),

  getMapFrame: () => {
    return get().elements.find((el): el is MapFrameElement => el.kind === 'mapframe')
  },
}))

function snapshot(s: LayoutState): LayoutSnapshot {
  return {
    elements: JSON.parse(JSON.stringify(s.elements)),
    pageConfig: JSON.parse(JSON.stringify(s.pageConfig)),
  }
}

export function createMapFrame(extent: [number, number, number, number]): MapFrameElement {
  const { pageConfig } = useLayoutStore.getState()
  const dims = getPageDimensions(
    PAPER_SIZES_MM[pageConfig.paperSize],
    pageConfig.orientation,
  )
  const m = pageConfig.margins
  const mapWidth = dims.widthMm - m.left - m.right
  const mapHeight = dims.heightMm - m.top - m.bottom
  return {
    id: makeElementId(),
    kind: 'mapframe',
    x: m.left,
    y: m.top,
    width: mapWidth,
    height: mapHeight,
    rotation: 0,
    zIndex: 0,
    extent,
    gridConfig: { ...DEFAULT_GRID },
  }
}

export function createNorthArrow(): NorthArrowElement {
  return {
    id: makeElementId(),
    kind: 'northarrow',
    x: 280,
    y: 15,
    width: 20,
    height: 30,
    rotation: 0,
    zIndex: 10,
    angle: 0,
    preset: 'arrow1',
    fillColor: '#18181b',
    strokeColor: '#18181b',
  }
}

export function createScaleBar(): ScaleBarElement {
  return {
    id: makeElementId(),
    kind: 'scalebar',
    x: 30,
    y: 175,
    width: 60,
    height: 12,
    rotation: 0,
    zIndex: 10,
    config: {
      segments: 4,
      units: 'auto',
      barStyle: 'line',
      fontFamily: 'Inter, sans-serif',
      fontSize: 8,
      fontColor: '#18181b',
      lineColor: '#18181b',
      fillColor: '#18181b',
      segmentWidthMm: 60,
    },
    linkedMapFrameId: '',
  }
}

export function createLegend(): LegendElement {
  return {
    id: makeElementId(),
    kind: 'legend',
    x: 250,
    y: 100,
    width: 50,
    height: 40,
    rotation: 0,
    zIndex: 10,
    config: {
      title: 'Legend',
      fontFamily: 'Inter, sans-serif',
      fontSize: 10,
      fontColor: '#18181b',
      columns: 1,
      patchWidth: 12,
      patchHeight: 8,
      items: [],
    },
  }
}

export function createTextElement(text: string): TextElement {
  return {
    id: makeElementId(),
    kind: 'text',
    x: 30,
    y: 15,
    width: 200,
    height: 30,
    rotation: 0,
    zIndex: 15,
    text,
    fontFamily: 'Inter, sans-serif',
    fontSize: 16,
    fontColor: '#18181b',
    bold: false,
    italic: false,
    alignment: 'left',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
  }
}
