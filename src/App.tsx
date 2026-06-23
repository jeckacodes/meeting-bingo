import { useState } from 'react'
import { CategoryId, GameState, GAME_STATE_VERSION, WinningLine } from './types'
import { generateCard } from './lib/cardGenerator'
import { LandingPage } from './components/LandingPage'
import { CategorySelect } from './components/CategorySelect'
import { GameBoard } from './components/GameBoard'
import { WinScreen } from './components/WinScreen'

type Screen = 'landing' | 'category' | 'game' | 'win'

function freshGame(): GameState {
  return {
    version: GAME_STATE_VERSION,
    status: 'idle',
    category: null,
    card: null,
    startedAt: null,
    completedAt: null,
    winningLine: null,
    winningWord: null,
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [game, setGame] = useState<GameState>(freshGame)

  const handleStart = () => setScreen('category')

  const handleCategorySelect = (category: CategoryId) => {
    setGame({
      ...freshGame(),
      status: 'playing',
      category,
      card: generateCard(category),
      startedAt: Date.now(),
    })
    setScreen('game')
  }

  const handleWin = (winningLine: WinningLine, winningWord: string) => {
    setGame((prev) => ({
      ...prev,
      status: 'won',
      completedAt: Date.now(),
      winningLine,
      winningWord,
    }))
    setScreen('win')
  }

  const handlePlayAgain = () => setScreen('category')

  const handleBackToHome = () => {
    setGame(freshGame())
    setScreen('landing')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {screen === 'landing' && <LandingPage onStart={handleStart} />}
      {screen === 'category' && (
        <CategorySelect onSelect={handleCategorySelect} onBack={handleBackToHome} />
      )}
      {screen === 'game' && game.card && (
        <GameBoard game={game} setGame={setGame} onWin={handleWin} />
      )}
      {screen === 'win' && (
        <WinScreen game={game} onPlayAgain={handlePlayAgain} onHome={handleBackToHome} />
      )}
    </div>
  )
}
