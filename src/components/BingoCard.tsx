import { BingoCard as BingoCardType, BingoSquare as BingoSquareType } from '../types'
import { BingoSquare } from './BingoSquare'

interface Props {
  card: BingoCardType
  winningIds: Set<string>
  missingIds: Set<string>
  reducedMotion: boolean
  /** When false, squares are non-interactive (e.g. the win screen). Defaults to true. */
  interactive?: boolean
  /** When true, dim squares that are not on the winning line. */
  dimNonWinning?: boolean
  onSquareClick: (square: BingoSquareType) => void
}

export function BingoCard({
  card,
  winningIds,
  missingIds,
  reducedMotion,
  interactive = true,
  dimNonWinning = false,
  onSquareClick,
}: Props) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {card.squares.flat().map((square) => {
        const isWinning = winningIds.has(square.id)
        return (
          <BingoSquare
            key={square.id}
            square={square}
            isWinning={isWinning}
            isMissing={missingIds.has(square.id)}
            dimmed={dimNonWinning && !isWinning}
            interactive={interactive}
            reducedMotion={reducedMotion}
            onClick={() => onSquareClick(square)}
          />
        )
      })}
    </div>
  )
}
