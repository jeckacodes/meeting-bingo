import { BingoSquare as BingoSquareType } from '../types'
import { cn } from '../lib/utils'

interface Props {
  square: BingoSquareType
  isWinning: boolean
  isMissing: boolean
  reducedMotion: boolean
  onClick: () => void
}

export function BingoSquare({ square, isWinning, isMissing, reducedMotion, onClick }: Props) {
  const { word, isFilled, isFreeSpace, isNew } = square

  const label = isFreeSpace
    ? 'Free space, filled'
    : `${word}${isFilled ? ', filled' : ''}`

  return (
    <button
      onClick={onClick}
      disabled={isFreeSpace}
      aria-pressed={isFilled}
      aria-label={label}
      className={cn(
        'relative aspect-square w-full rounded-lg border-2 p-1 transition-all duration-200',
        'flex items-center justify-center text-center text-[10px] leading-tight sm:text-sm font-medium',
        !reducedMotion && 'hover:scale-105 active:scale-95',
        // Default
        !isFilled && 'bg-white border-gray-200 text-gray-700 hover:border-blue-300',
        // Filled (§4 #18: bg-blue-500)
        isFilled && !isFreeSpace && 'bg-blue-500 border-blue-600 text-white',
        // Free space
        isFreeSpace && 'bg-amber-100 border-amber-300 text-amber-700 cursor-default',
        // Winning line — distinct color + ring (non-color cue added below via glyph)
        isWinning && 'bg-green-500 border-green-600 text-white ring-4 ring-green-300',
        // "One away" missing square highlight
        isMissing && !isFilled && 'border-amber-400 ring-2 ring-amber-200',
        // One-shot entrance for a freshly auto-filled square (§4 #19), motion-gated (§4 #20)
        isNew && !reducedMotion && 'animate-bounce-in',
      )}
    >
      {/* Non-color status glyph (§4 #13) */}
      {isWinning ? (
        <span className="absolute right-1 top-1 text-xs" aria-hidden="true">
          ★
        </span>
      ) : (
        isFilled &&
        !isFreeSpace && (
          <span className="absolute right-1 top-1 text-xs" aria-hidden="true">
            ✓
          </span>
        )
      )}

      <span
        className={cn(
          'break-words',
          isFilled && !isFreeSpace && 'line-through opacity-90',
        )}
      >
        {isFreeSpace ? '⭐ FREE' : word}
      </span>
    </button>
  )
}
