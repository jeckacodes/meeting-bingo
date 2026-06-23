import { GameState, GAME_STATE_VERSION } from '../types'

const STORAGE_KEY = 'meeting-bingo:game'

/**
 * Validate a parsed payload before trusting it (§4 #17). Only in-progress
 * ('playing') games with a well-formed 5x5 card are restorable. Note the
 * persisted shape carries no `isListening` field, so restoring can never
 * auto-start the mic.
 */
function isRestorableGame(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false
  const g = value as Partial<GameState>
  if (g.version !== GAME_STATE_VERSION) return false
  if (g.status !== 'playing') return false
  const card = g.card
  if (!card || !Array.isArray(card.squares) || card.squares.length !== 5) return false
  if (!card.squares.every((row) => Array.isArray(row) && row.length === 5)) return false
  if (!Array.isArray(card.words) || typeof card.wordToSquare !== 'object' || card.wordToSquare === null) {
    return false
  }
  return true
}

/** Persist an in-progress game; clears storage for any non-playing state. */
export function saveGame(game: GameState): void {
  try {
    if (game.status === 'playing' && game.card) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* storage unavailable / quota — non-fatal */
  }
}

/** Load a previously saved in-progress game, or null. Falls back safely on any error. */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isRestorableGame(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
