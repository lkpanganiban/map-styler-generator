import { useState, useRef, useEffect } from 'react'
import { LayoutCanvas } from './LayoutCanvas'
import { LayoutToolbar } from './LayoutToolbar'
import { ElementsList } from './ElementsList'
import { PropertiesPanel } from './PropertiesPanel'
import { PageSetupBar } from './PageSetupBar'
import { ExportDialog } from './ExportDialog'
import { Button } from '@/components/shared/ui/Button'
import { ArrowLeft, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function LayoutDesignerPage() {
  const navigate = useNavigate()
  const [showExport, setShowExport] = useState(false)
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [elementsPanelOpen, setElementsPanelOpen] = useState(true)
  const [canvasWidth, setCanvasWidth] = useState(0)
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
          <Button variant="primary" onClick={handleExportClick}>
            <FileDown className="w-4 h-4" />
            Export to PDF
          </Button>
        </div>
      </header>

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
