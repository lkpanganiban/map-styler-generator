import { useEffect, useRef, useState } from 'react'
import { Group, Rect, Image as KonvaImage, Line, Text as KonvaText } from 'react-konva'
import type { MapFrameElement as MapFrameType } from '@/types/layout'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useLayersStore } from '@/store/useLayersStore'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import ImageLayer from 'ol/layer/Image'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import Static from 'ol/source/ImageStatic'
import ImageWMS from 'ol/source/ImageWMS'
import VectorSource from 'ol/source/Vector'
import GeoJSONFormat from 'ol/format/GeoJSON'
import Projection from 'ol/proj/Projection'
import { register } from 'ol/proj/proj4'
import { transformExtent } from 'ol/proj'
import proj4 from 'proj4'

register(proj4)

interface MapFrameProps {
  element: MapFrameType
  scale: number
  onTransformEnd: (e: any) => void
}

export function MapFrameElement({ element, scale, onTransformEnd }: MapFrameProps) {
  const { selectedId, selectElement, updateElement } = useLayoutStore()
  const layers = useLayersStore((s) => s.layers)
  const isSelected = selectedId === element.id
  const [image, setImage] = useState<string | null>(null)
  const mapRef = useRef<Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const w = element.width * scale
  const h = element.height * scale
  const x = element.x * scale
  const y = element.y * scale

  useEffect(() => {
    const div = document.createElement('div')
    div.style.cssText = 'position:absolute;top:-9999px;left:-9999px;'
    document.body.appendChild(div)

    const mapSize = Math.max(w, h, 100)
    div.style.width = `${mapSize}px`
    div.style.height = `${mapSize}px`

    const map = new Map({
      target: div,
      layers: [
        new TileLayer({ source: new OSM() }),
      ],
      view: new View({
        projection: 'EPSG:3857',
      }),
      controls: [],
    })

    mapRef.current = map
    containerRef.current = div

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
      if (containerRef.current) {
        document.body.removeChild(containerRef.current)
        containerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !containerRef.current) return

    const map = mapRef.current
    const mapSize = Math.max(w, h, 100)
    map.setSize([mapSize, mapSize])

    const proj3857 = new Projection({ code: 'EPSG:3857', units: 'm' })

    const existingLayers = map.getLayers().getArray()
    for (let i = existingLayers.length - 1; i >= 0; i--) {
      const l = existingLayers[i]
      if (l.get('gisId')) {
        map.removeLayer(l)
      }
    }

    const visibleLayers = layers.filter((l) => l.visible)
    let combinedExtent: [number, number, number, number] | null = null

    for (const layer of visibleLayers) {
      if (layer.type === 'raster' && layer.dataUrl) {
        const rasterExtent = layer.extent

        let olExtent = rasterExtent
        if (layer.crs !== 'EPSG:3857') {
          try {
            olExtent = transformExtent(rasterExtent, layer.crs, 'EPSG:3857') as [number, number, number, number]
          } catch { /* use as-is */ }
        }

        const source = new Static({
          url: layer.dataUrl,
          projection: proj3857,
          imageExtent: olExtent,
        })

        const imgLayer = new ImageLayer({
          source,
          properties: { gisId: layer.id },
          opacity: layer.opacity,
        })

        map.addLayer(imgLayer)
        combinedExtent = extendExtent(combinedExtent, olExtent)
      } else if (layer.type === 'vector' && layer.geojsonData) {
        try {
          const geojson = JSON.parse(layer.geojsonData)
          const format = new GeoJSONFormat({
            dataProjection: layer.crs,
            featureProjection: 'EPSG:3857',
          })
          const features = format.readFeatures(geojson)

          if (features.length > 0) {
            const source = new VectorSource({ features })
            const vecLayer = new VectorLayer({
              source,
              properties: { gisId: layer.id },
              opacity: layer.opacity,
              style: {
                'fill-color': layer.style.fillColor,
                'stroke-color': layer.style.strokeColor,
                'stroke-width': layer.style.strokeWidth,
                'circle-radius': layer.style.pointRadius,
              } as any,
            })

            map.addLayer(vecLayer)

            const srcExtent = source.getExtent()
            if (srcExtent) {
              combinedExtent = extendExtent(combinedExtent, srcExtent as [number, number, number, number])
            }
          }
        } catch {
          // skip malformed data
        }
      } else if (layer.type === 'wms') {
        try {
          const source = new ImageWMS({
            url: layer.serviceUrl,
            params: {
              LAYERS: layer.layerName,
              VERSION: '1.3.0',
              FORMAT: 'image/png',
              TRANSPARENT: true,
            },
            projection: 'EPSG:3857',
            crossOrigin: 'anonymous',
            ratio: 1,
          })

          const imgLayer = new ImageLayer({
            source,
            properties: { gisId: layer.id },
            opacity: layer.opacity,
          })

          map.addLayer(imgLayer)
        } catch { /* skip */ }
      } else if (layer.type === 'wfs' && layer.geojsonData) {
        try {
          const geojson = JSON.parse(layer.geojsonData)
          const format = new GeoJSONFormat({
            dataProjection: layer.crs,
            featureProjection: 'EPSG:3857',
          })
          const features = format.readFeatures(geojson)

          if (features.length > 0) {
            const source = new VectorSource({ features })
            const vecLayer = new VectorLayer({
              source,
              properties: { gisId: layer.id },
              opacity: layer.opacity,
              style: {
                'fill-color': layer.style.fillColor,
                'stroke-color': layer.style.strokeColor,
                'stroke-width': layer.style.strokeWidth,
                'circle-radius': layer.style.pointRadius,
              } as any,
            })

            map.addLayer(vecLayer)

            const srcExtent = source.getExtent()
            if (srcExtent) {
              combinedExtent = extendExtent(combinedExtent, srcExtent as [number, number, number, number])
            }
          }
        } catch { /* skip */ }
      }
    }

    let fitExtent = element.extent
    if (combinedExtent) {
      fitExtent = combinedExtent
    } else if (fitExtent.every((v) => v === 0) && element.extent) {
      fitExtent = (element.extent || fitExtent) as [number, number, number, number]
    }

    if (fitExtent && fitExtent.some((v) => v !== 0)) {
      map.getView().fit(fitExtent, { padding: [10, 10, 10, 10] })
    }

    containerRef.current.style.width = `${mapSize}px`
    containerRef.current.style.height = `${mapSize}px`

    const allLayers = map.getLayers().getArray()
    const wmsSources: any[] = []

    for (const l of allLayers) {
      const gisId = l.get('gisId')
      if (!gisId) continue
      try {
        const src = (l as any).getSource?.()
        if (src && src instanceof ImageWMS) {
          wmsSources.push(src)
        }
      } catch { /* skip */ }
    }

    const capture = () => {
      const container = containerRef.current
      if (!container) return
      const canvas = container.querySelector('canvas')
      if (canvas) {
        try {
          setImage(canvas.toDataURL())
        } catch {
          // tainted canvas — WMS server may not support CORS
          setImage(null)
        }
      }
    }

    if (wmsSources.length > 0) {
      let loaded = 0
      const onLoad = () => {
        loaded++
        if (loaded >= wmsSources.length) {
          map.renderSync()
          map.once('rendercomplete', capture)
          // cleanup listeners
          for (const src of wmsSources) {
            src.un('imageloadend', onLoad)
            src.un('imageloaderror', onLoad)
          }
        }
      }
      for (const src of wmsSources) {
        src.once('imageloadend', onLoad)
        src.once('imageloaderror', onLoad)
      }
      map.renderSync()
    } else {
      map.once('rendercomplete', capture)
      map.renderSync()
    }
  }, [w, h, layers, element.extent])

  const handleDragEnd = (e: any) => {
    updateElement(element.id, {
      x: e.target.x() / scale,
      y: e.target.y() / scale,
    } as any)
  }

  return (
    <Group
      id={element.id}
      x={x}
      y={y}
      width={w}
      height={h}
      rotation={element.rotation || 0}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={onTransformEnd}
      onClick={() => selectElement(element.id)}
      onTap={() => selectElement(element.id)}
    >
      <Rect
        width={w}
        height={h}
        fill="#f4f4f5"
        stroke={isSelected ? '#52525b' : '#d4d4d8'}
        strokeWidth={isSelected ? 2 : 1}
      />
      {image && (
        <KonvaImage
          image={(() => {
            const img = new window.Image()
            img.src = image
            return img
          })()}
          width={w}
          height={h}
        />
      )}
      {element.gridConfig.enabled && renderGrid(element, w, h)}
      <Rect
        width={w}
        height={h}
        fill="transparent"
        stroke="#a1a1aa"
        strokeWidth={0.5}
        dash={[2, 4]}
      />
    </Group>
  )
}

function extendExtent(
  current: [number, number, number, number] | null,
  ext: [number, number, number, number],
): [number, number, number, number] {
  if (!current) return [...ext] as [number, number, number, number]
  return [
    Math.min(current[0], ext[0]),
    Math.min(current[1], ext[1]),
    Math.max(current[2], ext[2]),
    Math.max(current[3], ext[3]),
  ]
}

function renderGrid(
  element: MapFrameType,
  w: number,
  h: number,
) {
  const gc = element.gridConfig
  if (!gc.enabled) return null

  const scaleFactor = w / element.width
  const spacingPx = gc.spacingX * scaleFactor
  const numLinesX = Math.ceil(w / spacingPx)
  const numLinesY = Math.ceil(h / spacingPx)
  const dash = gc.lineStyle === 'dashed' ? [4, 4] : undefined
  const lines: React.ReactNode[] = []

  for (let i = 1; i < numLinesX; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * spacingPx, 0, i * spacingPx, h]}
        stroke={gc.lineColor}
        strokeWidth={gc.lineWidth}
        dash={dash}
      />,
    )
  }

  for (let i = 1; i < numLinesY; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * spacingPx, w, i * spacingPx]}
        stroke={gc.lineColor}
        strokeWidth={gc.lineWidth}
        dash={dash}
      />,
    )
  }

  if (gc.labelPosition !== 'none') {
    const fontSize = gc.labelFontSize * 2
    const yPos = gc.labelPosition === 'outside' ? -fontSize - 2 : h - fontSize - 2

    for (let i = 0; i < numLinesX; i++) {
      lines.push(
        <KonvaText
          key={`lv-${i}`}
          x={i * spacingPx + 3}
          y={yPos}
          text={`${Math.round(i * gc.spacingX)}`}
          fontSize={fontSize}
          fill={gc.labelColor}
        />,
      )
    }
  }

  return <>{lines}</>
}
