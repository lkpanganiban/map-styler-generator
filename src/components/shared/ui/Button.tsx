import { type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'primary'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
        'disabled:opacity-50 disabled:pointer-events-none',
        {
          default: 'bg-zinc-100 text-zinc-900 border border-zinc-300 hover:bg-zinc-200',
          ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100',
          outline: 'bg-transparent text-zinc-900 border border-zinc-300 hover:bg-zinc-100',
          primary: 'bg-zinc-800 text-white hover:bg-zinc-700',
        }[variant],
        {
          sm: 'h-7 px-2.5 text-xs',
          md: 'h-9 px-3.5 text-sm',
          lg: 'h-10 px-4.5 text-sm',
        }[size],
        className,
      )}
      {...props}
    />
  )
}
