import { deserializeTemplate } from './templateSchema'
import type { MapTemplate } from './templateSchema'

export function saveTemplateToFile(template: MapTemplate, filename: string) {
  const json = JSON.stringify(template, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function pickTemplateFile(): Promise<MapTemplate> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.mgt.json'

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected.'))
        return
      }
      try {
        const text = await file.text()
        const template = deserializeTemplate(text)
        resolve(template)
      } catch (err) {
        reject(err)
      }
    }

    input.click()
  })
}
