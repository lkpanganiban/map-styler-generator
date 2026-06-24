import { useState } from 'react'
import { Button } from '@/components/shared/ui/Button'
import { useLayoutStore } from '@/store/useLayoutStore'
import { exportToPdf } from '@/lib/pdf/exportPdf'
import { X, Loader2 } from 'lucide-react'

interface ExportDialogProps {
  imageDataUrl: string | null
  onClose: () => void
}

export function ExportDialog({ imageDataUrl, onClose }: ExportDialogProps) {
  const [status, setStatus] = useState<'idle' | 'rendering' | 'exporting' | 'done'>('idle')
  const pageConfig = useLayoutStore((s) => s.pageConfig)

  const handleExport = async () => {
    if (!imageDataUrl) return
    setStatus('exporting')
    try {
      await exportToPdf(imageDataUrl, pageConfig)
      setStatus('done')
    } catch (err: any) {
      alert('Export failed: ' + err.message)
      setStatus('idle')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl border border-zinc-200 w-96 max-w-full mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <h3 className="text-sm font-semibold text-zinc-800">Export to PDF</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="bg-white border border-zinc-200 rounded p-2 max-h-48 overflow-hidden">
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="Preview" className="w-full object-contain" />
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-zinc-400">
                Preview not available
              </div>
            )}
          </div>

          <div className="text-xs text-zinc-500">
            Page: {pageConfig.paperSize} ({pageConfig.orientation}), {pageConfig.dpi} DPI
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={status === 'exporting' || !imageDataUrl}
            >
              {status === 'exporting' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'done' ? 'Saved!' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
