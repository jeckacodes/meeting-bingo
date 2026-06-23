import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { GameState } from '../types'
import { countFilled } from '../lib/bingoChecker'
import { formatDuration } from '../lib/utils'
import { CATEGORIES } from '../data/categories'
import { buildShareText, shareResult } from '../lib/shareUtils'
import { playWinChime } from '../lib/sound'
import { Button } from './ui/Button'
import { BingoCard } from './BingoCard'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useSoundPreference } from '../hooks/useSoundPreference'

interface Props {
  game: GameState
  onPlayAgain: () => void
  onHome: () => void
}

export function WinScreen({ game, onPlayAgain, onHome }: Props) {
  const reducedMotion = useReducedMotion()
  const [soundEnabled, toggleSound] = useSoundPreference()
  const [shareMsg, setShareMsg] = useState('')

  // Celebrate — confetti unless the user prefers reduced motion (§4 #20). Sound off (UXR Moment 3).
  useEffect(() => {
    if (reducedMotion) return
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    const t = setTimeout(
      () => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }),
      250,
    )
    return () => clearTimeout(t)
  }, [reducedMotion])

  // Opt-in win chime (off by default). Also fires when the user toggles sound
  // on here, giving an instant preview.
  useEffect(() => {
    if (soundEnabled) playWinChime()
  }, [soundEnabled])

  const categoryName = CATEGORIES.find((c) => c.id === game.category)?.name ?? '—'
  const filled = game.card ? countFilled(game.card) : 0
  const durationMs =
    game.startedAt && game.completedAt ? game.completedAt - game.startedAt : null
  const winningIds = new Set(game.winningLine?.squares ?? [])

  const stats = [
    { label: 'Winning word', value: game.winningWord ?? '—' },
    { label: 'Category', value: categoryName },
    { label: 'Squares filled', value: String(filled) },
    { label: 'Time to bingo', value: durationMs != null ? formatDuration(durationMs) : '—' },
  ]

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    const text = buildShareText(
      { categoryName, winningWord: game.winningWord, durationMs, squaresFilled: filled },
      url,
    )
    const outcome = await shareResult(text)
    setShareMsg(
      outcome === 'copied'
        ? 'Copied to clipboard!'
        : outcome === 'shared'
          ? 'Shared!'
          : 'Could not share — try again.',
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <div className="text-6xl" aria-hidden="true">
        🎉
      </div>
      <h1 className="mt-1 text-5xl font-extrabold tracking-tight text-gray-900">BINGO!</h1>
      <p className="mt-2 text-gray-600">Five in a row — nicely done.</p>
      {/* Assertive announcement for screen readers (§4 #14) */}
      <div aria-live="assertive" className="sr-only">
        BINGO! You won.
      </div>

      {game.card && (
        <div className="mt-6 w-full max-w-xs">
          <BingoCard
            card={game.card}
            winningIds={winningIds}
            missingIds={new Set()}
            reducedMotion={reducedMotion}
            interactive={false}
            dimNonWinning
            onSquareClick={() => {}}
          />
        </div>
      )}

      <dl className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-3">
            <dt className="text-xs uppercase tracking-wide text-gray-500">{s.label}</dt>
            <dd className="mt-1 font-semibold text-gray-900">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onPlayAgain}>Play Again</Button>
        <Button variant="secondary" onClick={handleShare}>
          📤 Share
        </Button>
        <Button
          variant="ghost"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Win sound on' : 'Win sound off'}
        >
          {soundEnabled ? '🔊 Sound on' : '🔇 Sound off'}
        </Button>
        <Button variant="ghost" onClick={onHome}>
          Home
        </Button>
      </div>
      <p className="mt-3 h-5 text-sm text-green-700" aria-live="polite">
        {shareMsg}
      </p>
    </div>
  )
}
