import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names, resolving Tailwind conflicts (plan §4 #2). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
