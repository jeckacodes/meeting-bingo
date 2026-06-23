import { useCallback, useState } from 'react'

const STORAGE_KEY = 'meeting-bingo:sound'

/** Read the persisted preference; defaults to OFF (sound off by default). */
function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

/**
 * Persisted, opt-in sound preference (off by default). Returns the current
 * value and a toggle that writes through to localStorage.
 */
export function useSoundPreference(): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(readPreference)

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      } catch {
        /* storage unavailable — keep the in-memory value */
      }
      return next
    })
  }, [])

  return [enabled, toggle]
}
