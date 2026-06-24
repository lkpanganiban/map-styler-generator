import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { defaults as defaultControls } from 'ol/control'
import { ScaleLine, MousePosition } from 'ol/control'
import { createStringXY } from 'ol/coordinate'
import { setMapInstance, getMapInstance } from '@/lib/mapRef'
import 'ol/ol.css'

interface MapPreviewProps {
  onMapReady?: (map: Map) => void
}

export function MapPreview({ onMapReady }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const cbRef = useRef(onMapReady)
  cbRef.current = onMapReady

  useEffect(() => {
    if (!mapRef.current) return

    const existing = getMapInstance()

    if (existing) {
      existing.setTarget(mapRef.current)
      existing.updateSize()
      cbRef.current?.(existing)
    } else {
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
            properties: { gisId: 'basemap' },
          }),
        ],
        view: new View({
          center: [0, 0],
          zoom: 2,
          projection: 'EPSG:3857',
        }),
        controls: defaultControls({ attribution: true, zoom: true }).extend([
          new ScaleLine({
            units: 'metric',
            bar: true,
            steps: 4,
            text: true,
            minWidth: 100,
          }),
          new MousePosition({
            coordinateFormat: createStringXY(6),
            projection: 'EPSG:4326',
            className: 'ol-mouse-position-custom',
          }),
        ]),
      })

      setMapInstance(map)
      cbRef.current?.(map)
    }

    return () => {
      const map = getMapInstance()
      if (map) {
        map.setTarget(undefined)
      }
    }
  }, [])

  return (
    <div className="w-full h-full border-0">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
