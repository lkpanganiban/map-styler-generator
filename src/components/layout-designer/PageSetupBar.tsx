import { useLayoutStore } from '@/store/useLayoutStore'
import { Select } from '@/components/shared/ui/Select'
import type { PaperSize, PageOrientation } from '@/types/layout'

const PAPER_OPTIONS = [
  { value: 'A4', label: 'A4' },
  { value: 'A3', label: 'A3' },
  { value: 'Letter', label: 'Letter' },
]

const ORIENTATION_OPTIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

const DPI_OPTIONS = [
  { value: '96', label: '96 DPI' },
  { value: '150', label: '150 DPI' },
  { value: '300', label: '300 DPI' },
]

export function PageSetupBar() {
  const { pageConfig, setPageConfig } = useLayoutStore()

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-zinc-50 border-b border-zinc-200 shrink-0">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        Page Setup
      </span>
      <div className="flex items-center gap-3">
        <Select
          options={PAPER_OPTIONS}
          value={pageConfig.paperSize}
          onChange={(v) => setPageConfig({ paperSize: v as PaperSize })}
          label="Size"
        />
        <Select
          options={ORIENTATION_OPTIONS}
          value={pageConfig.orientation}
          onChange={(v) => setPageConfig({ orientation: v as PageOrientation })}
          label="Orientation"
        />
        <Select
          options={DPI_OPTIONS}
          value={String(pageConfig.dpi)}
          onChange={(v) => setPageConfig({ dpi: Number(v) })}
          label="DPI"
        />
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-zinc-400">
            Margins (mm):
          </span>
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="flex items-center gap-1">
              <label className="text-[10px] text-zinc-500 capitalize">{side}</label>
              <input
                type="number"
                min={0}
                max={50}
                value={pageConfig.margins[side]}
                onChange={(e) =>
                  setPageConfig({
                    margins: { ...pageConfig.margins, [side]: Number(e.target.value) || 0 },
                  })
                }
                className="w-12 h-7 rounded border border-zinc-300 px-1.5 text-xs text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
