import { useState, useRef, useEffect } from 'react'
import { LayoutCanvas } from './LayoutCanvas'
import { LayoutToolbar } from './LayoutToolbar'
import { ElementsList } from './ElementsList'
import { PropertiesPanel } from './PropertiesPanel'
import { TechnicalDescriptionDataPanel } from './TechnicalDescriptionDataPanel'
import { PageSetupBar } from './PageSetupBar'
import { ExportDialog } from './ExportDialog'
import { Button } from '@/components/shared/ui/Button'
import { ArrowLeft, FileDown, Save, FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLayoutStore } from '@/store/useLayoutStore'
import { serializeLayout } from '@/lib/template/templateSchema'
import { saveTemplateToFile, pickTemplateFile } from '@/lib/template/templateIO'
import { AlertCircle, X } from 'lucide-react'

export function LayoutDesignerPage() {
  const navigate = useNavigate()
  const [showExport, setShowExport] = useState(false)
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [elementsPanelOpen, setElementsPanelOpen] = useState(true)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const stageRef = useRef<any>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(entry.contentRect.width)
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const handleBack = () => {
    navigate('/')
  }

  const handleExportClick = async () => {
    if (stageRef.current) {
      const dataUrl = stageRef.current.toDataURL()
      setMapImage(dataUrl)
    }
    setShowExport(true)
  }

  const handleSaveTemplate = () => {
    const store = useLayoutStore.getState()
    const template = serializeLayout(store.pageConfig, store.elements)
    const date = new Date().toISOString().slice(0, 10)
    saveTemplateToFile(template, `map-template-${date}.mgt.json`)
  }

  const handleLoadTemplate = async () => {
    try {
      const template = await pickTemplateFile()
      const store = useLayoutStore.getState()
      store.loadTemplate(template.pageConfig, template.elements)
      setTemplateError(null)
    } catch (err: any) {
      setTemplateError(err?.message || 'Failed to load template.')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-sm font-semibold text-zinc-800">Map Layout Designer</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
            <Save className="w-4 h-4" />
            Save Template
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadTemplate}>
            <FolderOpen className="w-4 h-4" />
            Load Template
          </Button>
          <Button variant="primary" onClick={handleExportClick}>
            <FileDown className="w-4 h-4" />
            Export to PDF
          </Button>
        </div>
      </header>

      {templateError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{templateError}</span>
          <button onClick={() => setTemplateError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <PageSetupBar />

      <div className="flex-1 flex min-h-0">
        <LayoutToolbar
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(!panelOpen)}
          elementsPanelOpen={elementsPanelOpen}
          onToggleElementsPanel={() => setElementsPanelOpen(!elementsPanelOpen)}
        />

        {elementsPanelOpen && <ElementsList />}

        <div ref={canvasContainerRef} className="flex-1 bg-zinc-100 overflow-y-auto overflow-x-clip p-4 min-w-0">
          <LayoutCanvas stageRef={stageRef} availableWidth={canvasWidth} />
        </div>

        {panelOpen && <PropertiesPanel />}

        <TechnicalDescriptionDataPanel />
      </div>

      {showExport && (
        <ExportDialog
          imageDataUrl={mapImage}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
