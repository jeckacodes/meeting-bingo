import { BingoCard, BingoSquare, CategoryId } from '../types'
import { CATEGORIES } from '../data/categories'

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate a unique 5x5 bingo card for a category: 24 random words plus a
 * pre-filled center FREE space (§4 #6). Also builds a `wordToSquare` index for
 * O(1) auto-fill lookup (§4 #11).
 */
export function generateCard(categoryId: CategoryId): BingoCard {
  const category = CATEGORIES.find((c) => c.id === categoryId)
  if (!category) throw new Error(`Unknown category: ${categoryId}`)

  const selectedWords = shuffle(category.words).slice(0, 24)

  const squares: BingoSquare[][] = []
  const wordToSquare: Record<string, [number, number]> = {}
  let wordIndex = 0

  for (let row = 0; row < 5; row++) {
    const rowSquares: BingoSquare[] = []
    for (let col = 0; col < 5; col++) {
      const isFreeSpace = row === 2 && col === 2
      const word = isFreeSpace ? 'FREE' : selectedWords[wordIndex++]
      if (!isFreeSpace) wordToSquare[word.toLowerCase()] = [row, col]

      rowSquares.push({
        id: `${row}-${col}`,
        word,
        isFilled: isFreeSpace, // free space starts filled
        isAutoFilled: false,
        isFreeSpace,
        isNew: false,
        filledAt: isFreeSpace ? Date.now() : null,
        row,
        col,
      })
    }
    squares.push(rowSquares)
  }

  return { squares, words: selectedWords, wordToSquare }
}

/** Flat list of card words (excluding the free space). */
export function getCardWords(card: BingoCard): string[] {
  return card.words
}
