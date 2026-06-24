import { clsx } from 'clsx'

interface ColorInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function ColorInput({ value, onChange, label }: ColorInputProps) {
  const id = label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-zinc-600">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-zinc-300 cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            'h-8 flex-1 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-900',
            'focus:outline-none focus:ring-2 focus:ring-zinc-400',
          )}
        />
      </div>
    </div>
  )
}
