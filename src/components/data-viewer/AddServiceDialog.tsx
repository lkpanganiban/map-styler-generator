import { useState } from 'react'
import { Button } from '@/components/shared/ui/Button'
import { Input } from '@/components/shared/ui/Input'
import { Select } from '@/components/shared/ui/Select'
import { addWmsToMap } from '@/lib/gdal/parseWms'
import { addWfsToMap } from '@/lib/gdal/parseWfs'
import { X, Globe } from 'lucide-react'
import type OlMap from 'ol/Map'

interface AddServiceDialogProps {
  olMap: OlMap | null
  onClose: () => void
}

export function AddServiceDialog({ olMap, onClose }: AddServiceDialogProps) {
  const [serviceType, setServiceType] = useState<'WMS' | 'WFS'>('WMS')
  const [url, setUrl] = useState('')
  const [layerName, setLayerName] = useState('')
  const [crs, setCrs] = useState('EPSG:4326')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!olMap || !url.trim()) return

    setLoading(true)
    setError(null)

    const cleanUrl = url.trim()
    const name = layerName.trim() || (serviceType === 'WMS' ? 'WMS Layer' : 'WFS Layer')

    try {
      if (serviceType === 'WMS') {
        await addWmsToMap(olMap, name, cleanUrl, layerName.trim() || name, crs)
      } else {
        await addWfsToMap(olMap, name, cleanUrl, layerName.trim() || name, crs)
      }
      onClose()
    } catch (err: any) {
      setError(err?.message || `Failed to load ${serviceType} layer`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl border border-zinc-200 w-[440px] max-w-full mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-800">Add OGC Service</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <Select
            label="Service type"
            options={[
              { value: 'WMS', label: 'WMS (Web Map Service)' },
              { value: 'WFS', label: 'WFS (Web Feature Service)' },
            ]}
            value={serviceType}
            onChange={(v) => setServiceType(v as 'WMS' | 'WFS')}
          />

          <Input
            label="Service URL"
            placeholder={
              serviceType === 'WMS'
                ? 'https://example.com/geoserver/wms'
                : 'https://example.com/geoserver/wfs'
            }
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <Input
            label={serviceType === 'WMS' ? 'Layer name' : 'Type name'}
            placeholder={
              serviceType === 'WMS'
                ? 'namespace:layername'
                : 'namespace:featuretype'
            }
            value={layerName}
            onChange={(e) => setLayerName(e.target.value)}
          />

          <Input
            label="CRS (EPSG code)"
            placeholder="EPSG:4326"
            value={crs}
            onChange={(e) => setCrs(e.target.value)}
          />

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={loading || !url.trim()}
            >
              {loading ? 'Loading...' : `Add ${serviceType}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
