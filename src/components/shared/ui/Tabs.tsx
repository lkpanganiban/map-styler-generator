import { clsx } from 'clsx'

interface TabsProps {
  tabs: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={clsx('flex border-b border-zinc-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            value === tab.value
              ? 'border-zinc-800 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
