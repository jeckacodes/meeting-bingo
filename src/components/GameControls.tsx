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
          onClick={onToggleListen}
          aria-pressed={isListening}
        >
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 rounded-full',
              isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400',
            )}
            aria-hidden="true"
          />
          {isListening ? 'Stop listening' : 'Enable mic'}
        </Button>
      )}
      <Button variant="secondary" onClick={onNewCard}>
        🔄 New Card
      </Button>
    </div>
  )
}
