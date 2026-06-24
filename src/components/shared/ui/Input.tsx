import { type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-zinc-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-900',
          'focus:outline-none focus:ring-2 focus:ring-zinc-400',
          'placeholder:text-zinc-400',
          className,
        )}
        {...props}
      />
    </div>
  )
}
