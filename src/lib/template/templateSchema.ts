import type { PageConfig, LayoutElement } from '@/types/layout'

const SCHEMA_ID = 'map-generator-template'

export interface MapTemplate {
  schema: typeof SCHEMA_ID
  version: 1
  exportedAt: string
  pageConfig: PageConfig
  elements: LayoutElement[]
}

export function serializeLayout(pageConfig: PageConfig, elements: LayoutElement[]): MapTemplate {
  const cloned: MapTemplate = {
    schema: SCHEMA_ID,
    version: 1,
    exportedAt: new Date().toISOString(),
    pageConfig: JSON.parse(JSON.stringify(pageConfig)),
    elements: JSON.parse(JSON.stringify(elements)),
  }

  for (const el of cloned.elements) {
    if (el.kind === 'mapframe') {
      el.extent = [0, 0, 0, 0]
    } else if (el.kind === 'legend') {
      el.config.items = []
    }
  }

  return cloned
}

export function deserializeTemplate(json: string): MapTemplate {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Invalid template file: not valid JSON.')
  }

  const obj = parsed as Record<string, unknown>

  if (obj.schema !== SCHEMA_ID) {
    throw new Error(
      `Invalid template: expected schema "${SCHEMA_ID}" but got "${String(obj.schema ?? 'undefined')}".`,
    )
  }

  if (obj.version !== 1) {
    throw new Error(
      `Unsupported template version: ${obj.version}. This app supports version 1.`,
    )
  }

  return obj as unknown as MapTemplate
}

export function validateTemplate(obj: unknown): obj is MapTemplate {
  if (!obj || typeof obj !== 'object') return false
  const t = obj as Record<string, unknown>
  return (
    t.schema === SCHEMA_ID &&
    t.version === 1 &&
    typeof t.exportedAt === 'string' &&
    typeof t.pageConfig === 'object' &&
    t.pageConfig !== null &&
    Array.isArray(t.elements)
  )
}
