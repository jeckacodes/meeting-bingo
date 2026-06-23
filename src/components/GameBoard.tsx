import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { GameState, WinningLine, BingoSquare as Sq, Toast as ToastType } from '../types'
import { checkForBingo, countFilled, getClosestToWin } from '../lib/bingoChecker'
import { detectWordsWithAliases } from '../lib/wordDetector'
import { generateCard } from '../lib/cardGenerator'
import { CATEGORIES } from '../data/categories'
import { BingoCard } from './BingoCard'
import { GameControls } from './GameControls'
import { TranscriptPanel } from './TranscriptPanel'
import { ToastContainer } from './ui/Toast'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSoundPreference } from '../hooks/useSoundPreference'

interface Props {
  game: GameState
  setGame: Dispatch<SetStateAction<GameState>>
  onWin: (line: WinningLine, word: string) => void
}

const ISNEW_MS = 600 // one-shot auto-fill animation window (§4 #19)

export function GameBoard({ game, setGame, onWin }: Props) {
  const reducedMotion = useReducedMotion()
  const [soundEnabled, toggleSound] = useSoundPreference()
  const speech = useSpeechRecognition()
  const { isSupported, isListening, transcript, interimTranscript, error } = speech

  const [toasts, setToasts] = useState<ToastType[]>([])
  const [detectedWords, setDetectedWords] = useState<string[]>([])
  const [announcement, setAnnouncement] = useState('')
  const toastSeq = useRef(0)

  // Keep the latest game in a ref so the (async) speech callback never sees a stale card.
  const gameRef = useRef(game)
  useEffect(() => {
    gameRef.current = game
  }, [game])

  const card = game.card
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleFinal = useCallback(
    (finalText: string) => {
      const current = gameRef.current.card
      if (!current) return

      const alreadyFilled = new Set(
        current.squares.flat().filter((s) => s.isFilled).map((s) => s.word.toLowerCase()),
      )
      const hits = detectWordsWithAliases(finalText, current.words, alreadyFilled)
      if (hits.length === 0) return

      const next = structuredClone(current)
      const filled: string[] = []
      let lastWord = ''
      for (const word of hits) {
        const pos = next.wordToSquare[word.toLowerCase()]
        if (!pos) continue
        const sq = next.squares[pos[0]][pos[1]]
        if (sq.isFilled) continue
        sq.isFilled = true
        sq.isAutoFilled = true
        sq.isNew = true // one-shot (§4 #19)
        sq.filledAt = Date.now()
        filled.push(word)
        lastWord = word
      }
      if (filled.length === 0) return

      setGame((prev) => ({ ...prev, card: next }))

      // Side effects, fired once (outside the state updater).
      setToasts((prev) => [
        ...prev,
        ...filled.map((w) => ({
          id: `t${toastSeq.current++}`,
          message: `✨ ${w}`,
          type: 'success' as const,
        })),
      ])
      setDetectedWords((prev) => [...prev, ...filled].slice(-8))
      setAnnouncement(`${lastWord} detected, square filled`) // aria-live (§4 #14)

      // Clear the transient isNew flag so squares settle (§4 #19).
      window.setTimeout(() => {
        setGame((prev) => {
          if (!prev.card) return prev
          const cleared = structuredClone(prev.card)
          for (const w of filled) {
            const p = cleared.wordToSquare[w.toLowerCase()]
            if (p) cleared.squares[p[0]][p[1]].isNew = false
          }
          return { ...prev, card: cleared }
        })
      }, ISNEW_MS)

      const line = checkForBingo(next)
      if (line) onWin(line, lastWord) // winningWord = last detected word (§4 #12)
    },
    [setGame, onWin],
  )

  if (!card) return null

  const categoryName = CATEGORIES.find((c) => c.id === game.category)?.name ?? 'Meeting Bingo'
  const marked = countFilled(card) - 1 // exclude the free space
  const closest = getClosestToWin(card)
  const oneAway = closest?.needed === 1 ? closest : null
  const missingIds = new Set(oneAway ? oneAway.missing.map((m) => m.id) : [])
  const micBlocked = error === 'not-allowed' || error === 'service-not-allowed'

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
      if (line) onWin(line, sq.word)
    }
  }

  const handleNewCard = () => {
    if (!game.category) return
    setDetectedWords([])
    setGame((prev) => ({
      ...prev,
      card: generateCard(prev.category!),
      startedAt: Date.now(),
      winningLine: null,
      winningWord: null,
    }))
  }

  const toggleListen = () => {
    if (isListening) speech.stopListening()
    else speech.startListening(handleFinal)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">🎯 {categoryName}</h1>
          <p className="text-sm text-gray-500">{marked}/24 squares marked</p>
        </div>
        <GameControls
          onNewCard={handleNewCard}
          isSpeechSupported={isSupported}
          isListening={isListening}
          onToggleListen={toggleListen}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      </header>

      {/* Near-bingo tension indicator (§4 #21, UXR Moment 2) */}
      {oneAway && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          🔥 One away! Need: <span className="font-bold">{oneAway.missing[0].word}</span>
        </div>
      )}

      {/* Speech: enable-mic gate with privacy + audio-source guidance (§4 #9, §10) */}
      {isSupported ? (
        isListening ? (
          <TranscriptPanel
            transcript={transcript}
            interimTranscript={interimTranscript}
            detectedWords={detectedWords}
            isListening={isListening}
          />
        ) : (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-800">🎤 Auto-fill from speech</p>
            <p className="mt-1">
              🔒 Audio is processed locally on your device and is never recorded or sent to any
              server.
            </p>
            <p className="mt-1 text-gray-500">
              Tip: this captures your device microphone only — play the meeting audio aloud or hold
              your device near the speaker. You can always tap squares manually.
            </p>
            {micBlocked && (
              <p className="mt-2 font-medium text-red-600">
                Microphone access was blocked. Check your browser permissions, or keep playing by
                tapping squares.
              </p>
            )}
            <button
              onClick={toggleListen}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              Start listening
            </button>
          </div>
        )
      ) : (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          🎤 Speech recognition isn’t available in this browser — tap squares to play.
        </div>
      )}

      <div className="mt-4">
        <BingoCard
          card={card}
          winningIds={new Set()}
          missingIds={missingIds}
          reducedMotion={reducedMotion}
          onSquareClick={toggleSquare}
        />
      </div>

      {/* Visually-hidden polite announcer for auto-fills (§4 #14) */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
