import { useState, useRef, useCallback, type DragEvent } from 'react'
import { MapPreview } from './MapPreview'
import { LayerList } from './LayerList'
import { ExportMapButton } from './ExportMapButton'
import { parseGeoTIFF } from '@/lib/gdal/parseGeotiff'
import { parseShapefile } from '@/lib/gdal/parseShapefile'
import { parseGeoJSON } from '@/lib/gdal/parseGeoJSON'
import { AlertCircle, X, Upload, Plus } from 'lucide-react'
import { Button } from '@/components/shared/ui/Button'
import type OlMap from 'ol/Map'

export function DataViewerPage() {
  const [olMap, setOlMap] = useState<OlMap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!olMap) return
      const files = Array.from(fileList).filter(
        (f) =>
          f.name.match(/\.(tif|tiff|geojson|json|shp|dbf|prj|shx)$/i),
      )
      if (files.length === 0) return

      setIsLoading(true)

      const grouped: { basename: string; files: File[] }[] = []
      const standalone: File[] = []

      for (const f of files) {
        if (f.name.match(/\.(shp|dbf|prj|shx)$/i)) {
          const base = f.name.replace(/\.(shp|dbf|prj|shx)$/i, '')
          const group = grouped.find((g) => g.basename === base)
          if (group) {
            group.files.push(f)
          } else {
            grouped.push({ basename: base, files: [f] })
          }
        } else {
          standalone.push(f)
        }
      }

      for (const group of grouped) {
        try {
          await parseShapefile(group.files, olMap)
        } catch (err: any) {
          setError(err.message || `Failed to load shapefile: ${group.basename}`)
        }
      }

      for (const f of standalone) {
        try {
          if (f.name.match(/\.(tif|tiff)$/i)) {
            await parseGeoTIFF(f, olMap)
          } else if (f.name.match(/\.(geojson|json)$/i)) {
            await parseGeoJSON(f, olMap)
          }
        } catch (err: any) {
          setError(err.message || `Failed to load: ${f.name}`)
        }
      }

      setIsLoading(false)
    },
    [olMap],
  )

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const dragCounter = useRef(0)

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setDragOver(true)
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragOver(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <div
      className="h-full flex flex-col bg-zinc-100"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <h1 className="text-sm font-semibold text-zinc-800">Map Generator</h1>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-xs text-zinc-500 animate-pulse">Loading...</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Layer
          </Button>
          <ExportMapButton olMap={olMap} />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".tif,.tiff,.geojson,.json,.shp,.dbf,.prj,.shx"
            className="hidden"
            onChange={handleFilePick}
          />
        </div>
      </header>

      {error && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 relative">
        <div className="absolute top-3 left-3 z-10 w-56">
          <LayerList />
        </div>

        <div className="flex-1 relative">
          <MapPreview onMapReady={setOlMap} />

          {dragOver && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/20 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-2 px-8 py-6 bg-white rounded-xl shadow-lg border-2 border-dashed border-zinc-400">
                <Upload className="w-8 h-8 text-zinc-500" />
                <p className="text-sm font-medium text-zinc-700">Drop files to load</p>
                <p className="text-xs text-zinc-400">GeoTIFF, GeoJSON, Shapefile</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
