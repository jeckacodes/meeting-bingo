import { Button } from './ui/Button'

interface Props {
  onStart: () => void
}

const STEPS = [
  { icon: '🎯', title: 'Pick a pack', text: 'Choose Agile, Corporate, or Tech buzzwords.' },
  { icon: '🎤', title: 'Enable the mic', text: 'We listen locally and auto-fill words as you hear them.' },
  { icon: '🏆', title: 'Get five in a row', text: 'Row, column, or diagonal — shout BINGO!' },
]

export function LandingPage({ onStart }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="text-7xl mb-4" aria-hidden="true">
        🎯
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
        Meeting Bingo
      </h1>
      <p className="mt-3 max-w-md text-lg text-gray-600">
        Turn buzzword-filled meetings into a game. Mark a square every time you hear the jargon.
      </p>

      <Button size="lg" className="mt-8" onClick={onStart}>
        New Game
      </Button>

      <div className="mt-12 grid gap-4 sm:grid-cols-3 max-w-2xl w-full">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-xl border border-gray-200 bg-white p-4 text-left">
            <div className="text-2xl" aria-hidden="true">
              {s.icon}
            </div>
            <h2 className="mt-2 font-semibold text-gray-900">{s.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{s.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-md text-xs text-gray-500">
        🔒 Audio is processed locally on your device and is never recorded or sent to any server.
      </p>
    </div>
  )
}
