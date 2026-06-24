import { clsx } from 'clsx'

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  label?: string
  className?: string
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  className,
}: SliderProps) {
  const id = label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-zinc-600">
            {label}
          </label>
        )}
        <span className="text-xs text-zinc-400">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={clsx(
          'w-full h-1.5 bg-zinc-200 rounded-full appearance-none cursor-pointer',
          'accent-zinc-600',
          className,
        )}
      />
    </div>
  )
}
