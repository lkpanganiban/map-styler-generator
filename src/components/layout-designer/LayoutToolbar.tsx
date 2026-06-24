import {
  useLayoutStore,
  createNorthArrow,
  createScaleBar,
  createLegend,
  createTextElement,
} from '@/store/useLayoutStore'
import {
  Compass,
  Ruler,
  BookOpen,
  Type,
  Image,
  Grid3X3,
  Undo,
  Redo,
  Trash2,
} from 'lucide-react'

export function LayoutToolbar() {
  const { addElement, undo, redo, removeSelected, undoStack, redoStack, selectedId, elements, updateElement } = useLayoutStore()

  const mapFrame = elements.find((e): e is any => e.kind === 'mapframe')
  const gridEnabled = mapFrame?.gridConfig?.enabled ?? false

  const toggleGrid = () => {
    if (!mapFrame) return
    updateElement(mapFrame.id, {
      gridConfig: { ...mapFrame.gridConfig, enabled: !mapFrame.gridConfig.enabled },
    } as any)
  }

  const handleAddLogo = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/svg+xml,image/jpeg'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const id = `elem-${Date.now()}`
        addElement({
          id,
          kind: 'logo',
          x: 200,
          y: 60,
          width: 40,
          height: 40,
          rotation: 0,
          zIndex: 10,
          imageDataUrl: reader.result as string,
          lockedAspect: true,
        })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <div className="w-14 shrink-0 bg-white border-r border-zinc-200 flex flex-col items-center py-2 gap-1.5">
      <ToolbarButton tooltip="North Arrow" onClick={() => addElement(createNorthArrow())}>
        <Compass className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Scale Bar"
        onClick={() => {
          const s = createScaleBar()
          const mf = elements.find((e) => e.kind === 'mapframe')
          if (mf) s.linkedMapFrameId = mf.id
          addElement(s)
        }}
      >
        <Ruler className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarButton tooltip="Legend" onClick={() => addElement(createLegend())}>
        <BookOpen className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarButton tooltip="Text" onClick={() => addElement(createTextElement('Map Title'))}>
        <Type className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarButton tooltip="Logo" onClick={handleAddLogo}>
        <Image className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={gridEnabled ? 'Hide Grid' : 'Show Grid'}
        disabled={!mapFrame}
        active={gridEnabled}
        onClick={toggleGrid}
      >
        <Grid3X3 className="w-5 h-5" />
      </ToolbarButton>

      <div className="border-t border-zinc-200 my-1 w-8" />

      <ToolbarButton
        tooltip="Delete selected"
        disabled={!selectedId}
        onClick={removeSelected}
      >
        <Trash2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Undo"
        disabled={undoStack.length === 0}
        onClick={undo}
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Redo"
        disabled={redoStack.length === 0}
        onClick={redo}
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  children,
  tooltip,
  disabled,
  active,
  onClick,
}: {
  children: React.ReactNode
  tooltip: string
  disabled?: boolean
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
        active
          ? 'text-zinc-800 bg-zinc-200'
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
      } disabled:opacity-30 disabled:cursor-default`}
    >
      {children}
    </button>
  )
}
