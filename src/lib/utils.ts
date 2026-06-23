import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names, resolving Tailwind conflicts (plan §4 #2). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Human-readable duration, e.g. 94000 → "1m 34s". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
