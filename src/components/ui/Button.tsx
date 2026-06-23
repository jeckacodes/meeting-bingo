import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
  secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
}

const SIZES: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-5 py-2.5',
  lg: 'text-lg px-7 py-3',
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}
