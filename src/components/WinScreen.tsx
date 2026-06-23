import { GameState } from '../types'
import { countFilled } from '../lib/bingoChecker'
import { CATEGORIES } from '../data/categories'
import { Button } from './ui/Button'

interface Props {
  game: GameState
  onPlayAgain: () => void
  onHome: () => void
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function WinScreen({ game, onPlayAgain, onHome }: Props) {
  const categoryName = CATEGORIES.find((c) => c.id === game.category)?.name ?? '—'
  const filled = game.card ? countFilled(game.card) : 0
  const duration =
    game.startedAt && game.completedAt ? formatDuration(game.completedAt - game.startedAt) : '—'

  const stats = [
    { label: 'Winning word', value: game.winningWord ?? '—' },
    { label: 'Category', value: categoryName },
    { label: 'Squares filled', value: String(filled) },
    { label: 'Time to bingo', value: duration },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="text-6xl mb-2" aria-hidden="true">
        🎉
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">BINGO!</h1>
      <p className="mt-2 text-gray-600">Five in a row — nicely done.</p>

      <dl className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3 text-left">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-3">
            <dt className="text-xs uppercase tracking-wide text-gray-500">{s.label}</dt>
            <dd className="mt-1 font-semibold text-gray-900">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex gap-3">
        <Button onClick={onPlayAgain}>Play Again</Button>
        <Button variant="ghost" onClick={onHome}>
          Home
        </Button>
      </div>
    </div>
  )
}
