import { useLayoutStore } from '@/store/useLayoutStore'
import type { TechnicalDescriptionItem } from '@/types/layout'
import { Input } from '@/components/shared/ui/Input'
import { Select } from '@/components/shared/ui/Select'
import { ColorInput } from '@/components/shared/ui/ColorInput'
import { Button } from '@/components/shared/ui/Button'
import { northArrowNames } from '@/lib/icons/northArrows'
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react'

export function PropertiesPanel() {
  const { elements, selectedId, updateElement, removeElement, pageConfig, setPageConfig } =
    useLayoutStore()

  const selected = elements.find((el) => el.id === selectedId)

  if (!selected) {
    return (
      <div className="w-64 shrink-0 bg-white border-l border-zinc-200 p-4 overflow-y-auto overflow-x-hidden min-w-0">
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
      case 'mapframe':
        return (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Grid X (mm)"
                type="number"
                value={el.gridConfig.spacingX}
                onChange={(e) =>
                  updateElement(selected.id, {
                    gridConfig: { ...el.gridConfig, spacingX: Math.max(1, Number(e.target.value) || 1) },
                  } as any)
                }
                min={1}
              />
              <Input
                label="Grid Y (mm)"
                type="number"
                value={el.gridConfig.spacingY}
                onChange={(e) =>
                  updateElement(selected.id, {
                    gridConfig: { ...el.gridConfig, spacingY: Math.max(1, Number(e.target.value) || 1) },
                  } as any)
                }
                min={1}
              />
            </div>
            <Select
              label="Line style"
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'dashed', label: 'Dashed' },
              ]}
              value={el.gridConfig.lineStyle}
              onChange={(v) =>
                updateElement(selected.id, {
                  gridConfig: { ...el.gridConfig, lineStyle: v },
                } as any)
              }
            />
            <ColorInput
              label="Line color"
              value={el.gridConfig.lineColor}
              onChange={(v) =>
                updateElement(selected.id, {
                  gridConfig: { ...el.gridConfig, lineColor: v },
                } as any)
              }
            />
            <Input
              label="Line width"
              type="number"
              value={el.gridConfig.lineWidth}
              onChange={(e) =>
                updateElement(selected.id, {
                  gridConfig: { ...el.gridConfig, lineWidth: Math.max(0.1, Number(e.target.value) || 0.5) },
                } as any)
              }
              step={0.1}
              min={0.1}
            />
            <Select
              label="Label position"
              options={[
                { value: 'none', label: 'None' },
                { value: 'inside', label: 'Inside' },
                { value: 'outside', label: 'Outside' },
              ]}
              value={el.gridConfig.labelPosition}
              onChange={(v) =>
                updateElement(selected.id, {
                  gridConfig: { ...el.gridConfig, labelPosition: v },
                } as any)
              }
            />
          </div>
        )
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
      case 'techdesc':
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
                  config: { ...el.config, columns: Math.max(1, Math.min(3, Number(e.target.value) || 1)) },
                } as any)
              }
              min={1}
              max={3}
            />
            <Select
              label="Font"
              options={[
                { value: 'Inter, sans-serif', label: 'Sans' },
                { value: 'Georgia, serif', label: 'Serif' },
                { value: 'monospace', label: 'Mono' },
              ]}
              value={el.config.fontFamily}
              onChange={(v) =>
                updateElement(selected.id, {
                  config: { ...el.config, fontFamily: v },
                } as any)
              }
            />
            <Input
              label="Font size"
              type="number"
              value={el.config.fontSize}
              onChange={(e) =>
                updateElement(selected.id, {
                  config: { ...el.config, fontSize: Math.max(4, Number(e.target.value) || 4) },
                } as any)
              }
            />
            <ColorInput
              label="Title color"
              value={el.config.fontColor}
              onChange={(v) =>
                updateElement(selected.id, {
                  config: { ...el.config, fontColor: v },
                } as any)
              }
            />
            <ColorInput
              label="Label color"
              value={el.config.labelColor}
              onChange={(v) =>
                updateElement(selected.id, {
                  config: { ...el.config, labelColor: v },
                } as any)
              }
            />
            <ColorInput
              label="Value color"
              value={el.config.valueColor}
              onChange={(v) =>
                updateElement(selected.id, {
                  config: { ...el.config, valueColor: v },
                } as any)
              }
            />
            <hr className="border-zinc-200" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600">Items</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const items = [...el.config.items, { label: '', value: '', visible: true }]
                  updateElement(selected.id, {
                    config: { ...el.config, items },
                  } as any)
                }}
              >
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {el.config.items.map((item: TechnicalDescriptionItem, i: number) => (
                <div key={i} className="flex items-center gap-1.5 border border-zinc-200 rounded-md p-1.5">
                  <button
                    onClick={() => {
                      const items = el.config.items.map((it: TechnicalDescriptionItem, idx: number) =>
                        idx === i ? { ...it, visible: !it.visible } : it,
                      )
                      updateElement(selected.id, {
                        config: { ...el.config, items },
                      } as any)
                    }}
                    className="text-zinc-400 hover:text-zinc-600 shrink-0"
                    title={item.visible ? 'Hide' : 'Show'}
                  >
                    {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex flex-col gap-1 flex-1">
                    <input
                      placeholder="Label"
                      value={item.label}
                      onChange={(e) => {
                        const items = el.config.items.map((it: TechnicalDescriptionItem, idx: number) =>
                          idx === i ? { ...it, label: e.target.value } : it,
                        )
                        updateElement(selected.id, {
                          config: { ...el.config, items },
                        } as any)
                      }}
                      className="h-6 rounded border border-zinc-300 bg-white px-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    />
                    <input
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => {
                        const items = el.config.items.map((it: TechnicalDescriptionItem, idx: number) =>
                          idx === i ? { ...it, value: e.target.value } : it,
                        )
                        updateElement(selected.id, {
                          config: { ...el.config, items },
                        } as any)
                      }}
                      className="h-6 rounded border border-zinc-300 bg-white px-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const items = el.config.items.filter((_: TechnicalDescriptionItem, idx: number) => idx !== i)
                      updateElement(selected.id, {
                        config: { ...el.config, items },
                      } as any)
                    }}
                    className="text-zinc-400 hover:text-red-500 shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-64 shrink-0 bg-white border-l border-zinc-200 p-4 overflow-y-auto overflow-x-hidden min-w-0">
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
