import type { MapFrameElement } from '@/types/layout'

export function computeMapScale(
  mapFrame: MapFrameElement,
  dpi: number,
): number | null {
  const [minX, , maxX] = mapFrame.extent

  const extentWidth = maxX - minX
  const mmPerInch = 25.4
  const frameWidthInches = mapFrame.width / mmPerInch
  const pixelWidth = frameWidthInches * dpi

  if (extentWidth <= 0 || frameWidthInches <= 0) return null

  const metersPerPixel = extentWidth / pixelWidth
  const scale = metersPerPixel * dpi * (1000 / 25.4)

  return scale
}

export function computeNiceSegmentLength(
  mapScale: number,
  targetMm: number,
  dpi: number,
): { value: number; unit: 'meters' | 'kilometers'; segmentMm: number } {
  const mmPerInch = 25.4
  const metersPerMm = mapScale / (dpi * (1000 / mmPerInch))

  const roughValueMeters = targetMm * metersPerMm
  const niceValue = niceRound(roughValueMeters)

  let value = niceValue
  let unit: 'meters' | 'kilometers' = 'meters'

  if (niceValue >= 1000) {
    value = niceValue / 1000
    unit = 'kilometers'
  }

  const segmentMm = niceValue / metersPerMm

  return { value, unit, segmentMm }
}

function niceRound(value: number): number {
  const exp = Math.floor(Math.log10(Math.abs(value)) || 0)
  const power = 10 ** (exp - 1)
  const niceValues = [1, 2, 2.5, 5, 10]

  let best = power
  for (const n of niceValues) {
    const v = n * power
    if (v <= value * 1.5) {
      best = v
    }
  }
  return best * 10
}
