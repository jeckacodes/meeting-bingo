import { BingoCard, WinningLine } from '../types'

/**
 * Check all 12 winning lines (5 rows, 5 columns, 2 diagonals).
 * Returns the first winning line found, or null. The win derives purely from
 * card state; `winningWord` is supplied separately by the fill handler (§4 #12).
 */
export function checkForBingo(card: BingoCard): WinningLine | null {
  const { squares } = card

  // Rows
  for (let row = 0; row < 5; row++) {
    if (squares[row].every((sq) => sq.isFilled)) {
      return { type: 'row', index: row, squares: squares[row].map((sq) => sq.id) }
    }
  }

  // Columns
  for (let col = 0; col < 5; col++) {
    if (squares.every((row) => row[col].isFilled)) {
      return { type: 'column', index: col, squares: squares.map((row) => row[col].id) }
    }
  }

  // Diagonal: top-left → bottom-right
  if ([0, 1, 2, 3, 4].every((i) => squares[i][i].isFilled)) {
    return { type: 'diagonal', index: 0, squares: [0, 1, 2, 3, 4].map((i) => `${i}-${i}`) }
  }

  // Diagonal: top-right → bottom-left
  if ([0, 1, 2, 3, 4].every((i) => squares[i][4 - i].isFilled)) {
    return { type: 'diagonal', index: 1, squares: [0, 1, 2, 3, 4].map((i) => `${i}-${4 - i}`) }
  }

  return null
}

/** Count of filled squares (the free space counts). */
export function countFilled(card: BingoCard): number {
  return card.squares.flat().filter((sq) => sq.isFilled).length
}

export interface ClosestToWin {
  needed: number
  line: string
  /** Unfilled squares of the closest line, so the UI can say "Need: <word>" (§4 #21). */
  missing: { word: string; id: string }[]
}

/**
 * Find the line closest to completion (1+ squares away), including which
 * square(s)/word(s) are still missing so the UI can render the "one away"
 * tension state (§4 #21). Returns null only when there is no incomplete line.
 */
export function getClosestToWin(card: BingoCard): ClosestToWin | null {
  const { squares } = card

  const lines = [
    ...squares.map((row, i) => ({ squares: row, name: `Row ${i + 1}` })),
    ...[0, 1, 2, 3, 4].map((col) => ({
      squares: squares.map((row) => row[col]),
      name: `Column ${col + 1}`,
    })),
    { squares: [0, 1, 2, 3, 4].map((i) => squares[i][i]), name: 'Diagonal ↘' },
    { squares: [0, 1, 2, 3, 4].map((i) => squares[i][4 - i]), name: 'Diagonal ↙' },
  ]

  let closest: ClosestToWin | null = null
  for (const line of lines) {
    const needed = line.squares.filter((sq) => !sq.isFilled).length
    if (needed > 0 && (closest === null || needed < closest.needed)) {
      closest = {
        needed,
        line: line.name,
        missing: line.squares
          .filter((sq) => !sq.isFilled)
          .map((sq) => ({ word: sq.word, id: sq.id })),
      }
    }
  }

  return closest
}
