import { Dispatch, SetStateAction } from 'react'
import { GameState, WinningLine, BingoSquare as Sq } from '../types'
import { checkForBingo, countFilled } from '../lib/bingoChecker'
import { generateCard } from '../lib/cardGenerator'
import { CATEGORIES } from '../data/categories'
import { BingoCard } from './BingoCard'
import { GameControls } from './GameControls'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Props {
  game: GameState
  setGame: Dispatch<SetStateAction<GameState>>
  onWin: (line: WinningLine, word: string) => void
}

export function GameBoard({ game, setGame, onWin }: Props) {
  const reducedMotion = useReducedMotion()
  const card = game.card
  if (!card) return null

  const categoryName = CATEGORIES.find((c) => c.id === game.category)?.name ?? 'Meeting Bingo'
  const marked = countFilled(card) - 1 // exclude the always-filled free space

  const toggleSquare = (square: Sq) => {
    if (square.isFreeSpace) return
    const next = structuredClone(card)
    const sq = next.squares[square.row][square.col]
    const filling = !sq.isFilled
    sq.isFilled = filling
    sq.isAutoFilled = false
    sq.isNew = false
    sq.filledAt = filling ? Date.now() : null
    setGame((prev) => ({ ...prev, card: next }))
    if (filling) {
      const line = checkForBingo(next)
      if (line) onWin(line, sq.word) // winningWord = the square just tapped (§4 #12)
    }
  }

  const handleNewCard = () => {
    if (!game.category) return
    setGame((prev) => ({
      ...prev,
      card: generateCard(prev.category!),
      startedAt: Date.now(),
      winningLine: null,
      winningWord: null,
    }))
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">🎯 {categoryName}</h1>
          <p className="text-sm text-gray-500" aria-live="polite">
            {marked}/24 squares marked
          </p>
        </div>
        <GameControls onNewCard={handleNewCard} isSpeechSupported={false} />
      </header>

      <BingoCard
        card={card}
        winningIds={new Set()}
        missingIds={new Set()}
        reducedMotion={reducedMotion}
        onSquareClick={toggleSquare}
      />
    </div>
  )
}
