// Shared type definitions for Meeting Bingo.
// Reconciled with implementation plan §4: GameState drops `filledCount`
// (derived via countFilled, §4 #15) and carries `version` (§4 #17);
// BingoSquare adds a transient `isNew` flag (§4 #19); BingoCard carries a
// `wordToSquare` index (§4 #11).

// =============================================
// CATEGORY & WORDS
// =============================================
export type CategoryId = 'agile' | 'corporate' | 'tech';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  words: string[];
}

// =============================================
// BINGO CARD
// =============================================
export interface BingoSquare {
  id: string; // "row-col", e.g. "2-3"
  word: string;
  isFilled: boolean;
  isAutoFilled: boolean; // filled by speech recognition
  isFreeSpace: boolean;
  isNew: boolean; // transient one-shot for the auto-fill animation (§4 #19)
  filledAt: number | null;
  row: number;
  col: number;
}

export interface BingoCard {
  squares: BingoSquare[][]; // 5x5 grid
  words: string[]; // flat list for detection
  wordToSquare: Record<string, [number, number]>; // lowercased word -> [row, col] (§4 #11)
}

// =============================================
// GAME STATE
// =============================================
export type GameStatus = 'idle' | 'setup' | 'playing' | 'won';

export interface WinningLine {
  type: 'row' | 'column' | 'diagonal';
  index: number; // 0-4 for row/col, 0-1 for diagonal
  squares: string[]; // IDs of winning squares
}

/** Bump when the persisted GameState shape changes (§4 #17). */
export const GAME_STATE_VERSION = 1;

export interface GameState {
  version: number;
  status: GameStatus;
  category: CategoryId | null;
  card: BingoCard | null;
  startedAt: number | null;
  completedAt: number | null;
  winningLine: WinningLine | null;
  winningWord: string | null;
}

// =============================================
// SPEECH RECOGNITION
// =============================================
export interface SpeechRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// =============================================
// UI STATE
// =============================================
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  duration?: number;
}
