import { CategoryId } from '../types'
import { CATEGORIES } from '../data/categories'
import { Button } from './ui/Button'

interface Props {
  onSelect: (id: CategoryId) => void
  onBack: () => void
}

export function CategorySelect({ onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:underline"
      >
        ← Back
      </button>

      <h1 className="mt-4 text-3xl font-bold text-gray-900">Choose a buzzword pack</h1>
      <p className="mt-1 text-gray-600">Each pack generates a fresh 5×5 card.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const sampleWords = cat.words.slice(0, 4)
          return (
            <div
              key={cat.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="text-4xl" aria-hidden="true">
                {cat.icon}
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900">{cat.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{cat.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {sampleWords.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {w}
                  </span>
                ))}
                <span className="px-1 py-0.5 text-xs text-gray-400">+{cat.words.length - 4} more</span>
              </div>

              <Button className="mt-5 w-full" onClick={() => onSelect(cat.id)}>
                Select
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
