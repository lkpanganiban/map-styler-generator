import { useLayoutStore } from '@/store/useLayoutStore'
import { Input } from '@/components/shared/ui/Input'
import { Select } from '@/components/shared/ui/Select'
import { ColorInput } from '@/components/shared/ui/ColorInput'
import { Button } from '@/components/shared/ui/Button'
import { northArrowNames } from '@/lib/icons/northArrows'
import { Trash2 } from 'lucide-react'

export function PropertiesPanel() {
  const { elements, selectedId, updateElement, removeElement, pageConfig, setPageConfig } =
    useLayoutStore()

  const selected = elements.find((el) => el.id === selectedId)

  if (!selected) {
    return (
      <div className="w-64 shrink-0 bg-white border-l border-zinc-200 p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          Page Properties
        </h3>
        <div className="flex flex-col gap-3">
          <Input
            label="DPI"
            type="number"
            value={pageConfig.dpi}
            onChange={(e) => setPageConfig({ dpi: Number(e.target.value) || 150 })}
            min={72}
            max={600}
          />
        </div>
      </div>
    )
  }

  const commonProps = (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="X (mm)"
          type="number"
          value={Math.round(selected.x * 10) / 10}
          onChange={(e) => updateElement(selected.id, { x: Number(e.target.value) || 0 } as any)}
        />
        <Input
          label="Y (mm)"
          type="number"
          value={Math.round(selected.y * 10) / 10}
          onChange={(e) => updateElement(selected.id, { y: Number(e.target.value) || 0 } as any)}
        />
        <Input
          label="W (mm)"
          type="number"
          value={Math.round(selected.width * 10) / 10}
          onChange={(e) =>
            updateElement(selected.id, { width: Math.max(1, Number(e.target.value) || 1) } as any)
          }
        />
        <Input
          label="H (mm)"
          type="number"
          value={Math.round(selected.height * 10) / 10}
          onChange={(e) =>
            updateElement(selected.id, { height: Math.max(1, Number(e.target.value) || 1) } as any)
          }
        />
      </div>
    </div>
  )

  const renderKindProps = () => {
    const el = selected as any
    switch (selected.kind) {
      case 'northarrow':
        return (
          <div className="flex flex-col gap-3">
            <Select
              label="Arrow style"
              options={Object.entries(northArrowNames).map(([k, v]) => ({ value: k, label: v }))}
              value={el.preset}
              onChange={(v) => updateElement(selected.id, { preset: v } as any)}
            />
            <ColorInput
              label="Fill color"
              value={el.fillColor}
              onChange={(v) => updateElement(selected.id, { fillColor: v } as any)}
            />
          </div>
        )
      case 'scalebar':
        return (
          <div className="flex flex-col gap-3">
            <Input
              label="Segments"
              type="number"
              value={el.config.segments}
              onChange={(e) =>
                updateElement(selected.id, {
                  config: { ...el.config, segments: Math.max(1, Number(e.target.value) || 1) },
                } as any)
              }
              min={1}
              max={10}
            />
            <Select
              label="Units"
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'meters', label: 'Meters' },
                { value: 'kilometers', label: 'Kilometers' },
              ]}
              value={el.config.units}
              onChange={(v) =>
                updateElement(selected.id, {
                  config: { ...el.config, units: v },
                } as any)
              }
            />
            <Select
              label="Style"
              options={[
                { value: 'line', label: 'Line' },
                { value: 'bar', label: 'Bar' },
              ]}
              value={el.config.barStyle}
              onChange={(v) =>
                updateElement(selected.id, {
                  config: { ...el.config, barStyle: v },
                } as any)
              }
            />
          </div>
        )
      case 'legend':
        return (
          <div className="flex flex-col gap-3">
            <Input
              label="Title"
              value={el.config.title}
              onChange={(e) =>
                updateElement(selected.id, {
                  config: { ...el.config, title: e.target.value },
                } as any)
              }
            />
            <Input
              label="Columns"
              type="number"
              value={el.config.columns}
              onChange={(e) =>
                updateElement(selected.id, {
                  config: { ...el.config, columns: Math.max(1, Number(e.target.value) || 1) },
                } as any)
              }
              min={1}
              max={3}
            />
          </div>
        )
      case 'text':
        return (
          <div className="flex flex-col gap-3">
            <Input
              label="Text"
              value={el.text}
              onChange={(e) => updateElement(selected.id, { text: e.target.value } as any)}
            />
            <Select
              label="Font"
              options={[
                { value: 'Inter, sans-serif', label: 'Sans' },
                { value: 'Georgia, serif', label: 'Serif' },
                { value: 'monospace', label: 'Mono' },
              ]}
              value={el.fontFamily}
              onChange={(v) => updateElement(selected.id, { fontFamily: v } as any)}
            />
            <Input
              label="Size"
              type="number"
              value={el.fontSize}
              onChange={(e) =>
                updateElement(selected.id, { fontSize: Math.max(4, Number(e.target.value) || 4) } as any)
              }
            />
            <ColorInput
              label="Color"
              value={el.fontColor}
              onChange={(v) => updateElement(selected.id, { fontColor: v } as any)}
            />
            <div className="flex gap-2">
              <Button
                variant={el.bold ? 'primary' : 'outline'}
                size="sm"
                onClick={() => updateElement(selected.id, { bold: !el.bold } as any)}
              >
                Bold
              </Button>
              <Button
                variant={el.italic ? 'primary' : 'outline'}
                size="sm"
                onClick={() => updateElement(selected.id, { italic: !el.italic } as any)}
              >
                Italic
              </Button>
            </div>
            <Select
              label="Align"
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]}
              value={el.alignment}
              onChange={(v) =>
                updateElement(selected.id, { alignment: v } as any)
              }
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-64 shrink-0 bg-white border-l border-zinc-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          {selected.kind}
        </h3>
        <button
          onClick={() => removeElement(selected.id)}
          className="text-zinc-400 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {commonProps}
        {renderKindProps()}
        <hr className="border-zinc-200" />
        <Input
          label="Rotation (°)"
          type="number"
          value={Math.round(selected.rotation * 10) / 10}
          onChange={(e) => updateElement(selected.id, { rotation: Number(e.target.value) || 0 } as any)}
        />
      </div>
    </div>
  )
}
