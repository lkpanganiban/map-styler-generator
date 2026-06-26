import { useLayoutStore } from '@/store/useLayoutStore'
import type { TechnicalDescriptionElement } from '@/types/layout'
import { Button } from '@/components/shared/ui/Button'
import { Plus, Trash2 } from 'lucide-react'

function colLabel(index: number): string {
  let label = ''
  let n = index
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

export function TechnicalDescriptionDataPanel() {
  const { elements, selectedId, updateElement } = useLayoutStore()
  const element = elements.find(
    (el): el is TechnicalDescriptionElement =>
      el.id === selectedId && el.kind === 'techdesc',
  )

  if (!element) {
    return (
      <div className="w-80 shrink-0 bg-white border-l border-zinc-200 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-zinc-200 shrink-0">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Technical Description Data
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-zinc-400 text-center">
            Select a technical description element to edit its data.
          </p>
        </div>
      </div>
    )
  }

  const { config } = element
  const rows = config.rows.length > 0 ? config.rows : [[]]
  const colCount = Math.max(1, ...rows.map((r) => r.length))

  const paddedRows = rows.map((row) => {
    const cells = [...row]
    while (cells.length < colCount) cells.push('')
    return cells
  })

  const setRows = (nextRows: string[][]) => {
    updateElement(element.id, {
      config: { ...config, rows: nextRows },
    } as any)
  }

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const next = paddedRows.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? value : cell)),
    )
    setRows(next)
  }

  const addRow = () => {
    setRows([...paddedRows, Array(colCount).fill('')])
  }

  const addColumn = () => {
    setRows(paddedRows.map((row) => [...row, '']))
  }

  const removeRow = (idx: number) => {
    const next = paddedRows.filter((_, i) => i !== idx)
    setRows(next)
  }

  const removeColumn = (idx: number) => {
    const next = paddedRows
      .map((row) => row.filter((_, i) => i !== idx))
      .filter((row) => row.length > 0 || paddedRows.length === 1)
    setRows(next)
  }

  return (
    <div className="w-80 shrink-0 bg-white border-l border-zinc-200 flex flex-col min-w-0">
      <div className="px-4 py-3 border-b border-zinc-200 shrink-0">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Technical Description Data
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="w-3.5 h-3.5" /> Row
          </Button>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="w-3.5 h-3.5" /> Column
          </Button>
        </div>

        <table className="w-full border-collapse border border-zinc-300 text-xs">
          <thead>
            <tr>
              <th className="w-10 border border-zinc-300 bg-zinc-50 p-1"></th>
              {Array.from({ length: colCount }, (_, c) => (
                <th
                  key={`col-${c}`}
                  className="border border-zinc-300 bg-zinc-50 p-1 text-center font-medium text-zinc-600"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{colLabel(c)}</span>
                    {colCount > 1 && (
                      <button
                        onClick={() => removeColumn(c)}
                        className="text-zinc-400 hover:text-red-500"
                        title="Remove column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paddedRows.map((row, r) => (
              <tr key={`row-${r}`}>
                <td className="border border-zinc-300 bg-zinc-50 p-1 text-center text-zinc-600">
                  <div className="flex items-center justify-center gap-1">
                    <span>{r + 1}</span>
                    {paddedRows.length > 1 && (
                      <button
                        onClick={() => removeRow(r)}
                        className="text-zinc-400 hover:text-red-500"
                        title="Remove row"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
                {row.map((cell, c) => (
                  <td key={`cell-${r}-${c}`} className="border border-zinc-300 p-0">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      className="w-full min-w-[4rem] h-8 px-2 border-0 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
