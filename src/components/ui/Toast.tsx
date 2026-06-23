import { useEffect } from 'react'
import { Toast as ToastType } from '../../types'
import { cn } from '../../lib/utils'

interface Props {
  toast: ToastType
  onDismiss: (id: string) => void
}

const STYLES: Record<ToastType['type'], string> = {
  success: 'bg-green-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
}

export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 2500)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto rounded-lg px-4 py-2 text-sm font-medium shadow-lg',
        STYLES[toast.type],
      )}
    >
      {toast.message}
    </div>
  )
}

/** Fixed-position stack container for active toasts. */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
