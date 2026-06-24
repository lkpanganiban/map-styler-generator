import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/shared/ui/Button'
import { useLayersStore } from '@/store/useLayersStore'
import { useLayoutStore, createMapFrame } from '@/store/useLayoutStore'
import { getCombinedVisibleExtent } from '@/lib/mapRef'
import { FileDown } from 'lucide-react'
import type OlMap from 'ol/Map'

interface ExportMapButtonProps {
  olMap: OlMap | null
}

export function ExportMapButton({ olMap }: ExportMapButtonProps) {
  const navigate = useNavigate()
  const layers = useLayersStore((s) => s.layers)

  const handleExport = () => {
    if (!olMap) return

    const combinedExtent = getCombinedVisibleExtent()
    const extent = combinedExtent || olMap.getView().calculateExtent(olMap.getSize())

    useLayoutStore.getState().setElements([])
    useLayoutStore.getState().redoStack = []
    useLayoutStore.getState().undoStack = []
    useLayoutStore.getState().selectedId = null

    const mapFrame = createMapFrame(extent as unknown as [number, number, number, number])
    useLayoutStore.getState().addElement(mapFrame)

    navigate('/layout')
  }

  return (
    <Button
      variant="primary"
      size="md"
      disabled={layers.length === 0}
      onClick={handleExport}
    >
      <FileDown className="w-4 h-4" />
      Export Map
    </Button>
  )
}
