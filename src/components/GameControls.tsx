import { Button } from './ui/Button'
import { cn } from '../lib/utils'

interface Props {
  onNewCard: () => void
  /** Speech wiring (Phase 3). When unsupported, the listen toggle is hidden (§4 #10). */
  isSpeechSupported: boolean
  isListening?: boolean
  onToggleListen?: () => void
}

export function GameControls({ onNewCard, isSpeechSupported, isListening, onToggleListen }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isSpeechSupported && onToggleListen && (
        <Button
          variant={isListening ? 'secondary' : 'primary'}
          className={cn(
            !isListening &&
              'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500',
          )}
          onClick={onToggleListen}
          aria-pressed={isListening}
        >
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 rounded-full',
              isListening ? 'bg-red-500 animate-pulse' : 'bg-white',
            )}
            aria-hidden="true"
          />
          {isListening ? 'Stop listening' : 'Start listening'}
        </Button>
      )}
      <Button variant="secondary" onClick={onNewCard}>
        🔄 New Card
      </Button>
    </div>
  )
}
