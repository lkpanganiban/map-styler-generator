import { clsx } from 'clsx'

interface LabelProps {
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

export function Label({ children, className, htmlFor }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx('text-xs font-medium text-zinc-600', className)}
    >
      {children}
    </label>
  )
}
