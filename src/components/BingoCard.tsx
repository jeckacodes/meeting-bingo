import { BingoCard as BingoCardType, BingoSquare as BingoSquareType } from '../types'
import { BingoSquare } from './BingoSquare'

interface Props {
  card: BingoCardType
  winningIds: Set<string>
  missingIds: Set<string>
  reducedMotion: boolean
  onSquareClick: (square: BingoSquareType) => void
}

export function BingoCard({ card, winningIds, missingIds, reducedMotion, onSquareClick }: Props) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {card.squares.flat().map((square) => (
        <BingoSquare
          key={square.id}
          square={square}
          isWinning={winningIds.has(square.id)}
          isMissing={missingIds.has(square.id)}
          reducedMotion={reducedMotion}
          onClick={() => onSquareClick(square)}
        />
      ))}
    </div>
  )
}
