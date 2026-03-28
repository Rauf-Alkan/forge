'use client'

import { useState, FormEvent } from 'react'

type Props = {
  onSubmit: (topic: string) => void
}

export default function QuoteForm({ onSubmit }: Props) {
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!topic.trim() || submitting) return
    setSubmitting(true)
    onSubmit(topic.trim())
  }

  const charCount = topic.length
  const isOverLimit = charCount > 200

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
          <h2 className="text-xl font-semibold text-white">New Quote Video</h2>
        </div>
        <p className="text-gray-600 text-sm pl-3.5">
          Enter a topic — a powerful quote, image, and music will be combined.
        </p>
      </div>

      {/* Form card */}
      <div className="card-border">
        <div className="bg-[#0a0d14] rounded-2xl p-1">
          <form onSubmit={handleSubmit}>
            <textarea
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                'Enter your quote topic in English\n\nExamples:\n• perseverance\n• discipline and wealth\n• morning routine'
              }
              className="w-full bg-transparent text-white rounded-xl px-4 pt-4 pb-2 text-sm placeholder-gray-700 focus:outline-none resize-none leading-relaxed"
              disabled={submitting}
            />

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <span
                className={`text-[11px] tabular-nums transition-colors ${
                  isOverLimit ? 'text-red-500' : 'text-gray-700'
                }`}
              >
                {charCount} / 200
              </span>
              <span className="text-[11px] text-gray-700">
                20-second static quote video
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.04] mx-4" />

            {/* Submit */}
            <div className="p-3">
              <button
                type="submit"
                disabled={submitting || !topic.trim() || isOverLimit}
                className="w-full disabled:bg-gray-800 disabled:text-gray-600 bg-amber-600/80 hover:bg-amber-500/80 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all duration-300 shadow-[0_0_20px_-4px_rgba(217,119,6,0.4)] disabled:shadow-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668 2.812.75.75 0 11-.836 1.244 31.655 31.655 0 00-1.29-.726 19.738 19.738 0 01-.484 2.25 19.848 19.848 0 013.34 4.07.75.75 0 11-1.31.73 18.352 18.352 0 00-.654-1.016 19.878 19.878 0 01-6.15 2.425.75.75 0 01-.338-1.46 18.382 18.382 0 005.61-2.185 18.489 18.489 0 00-2.552-2.152 19.841 19.841 0 01-1.726 1.448.75.75 0 01-.942-1.166 18.373 18.373 0 001.518-1.292 18.497 18.497 0 00-2.515-1.393 18.43 18.43 0 00-.656 1.02.75.75 0 11-1.31-.73 19.847 19.847 0 013.34-4.072 19.757 19.757 0 01-.484-2.25 31.67 31.67 0 00-1.29.726.75.75 0 01-.836-1.244 33.186 33.186 0 016.669-2.812V2.75A.75.75 0 0110 2zM10 6a18.45 18.45 0 012.024.112A18.422 18.422 0 0110 7.72a18.422 18.422 0 01-2.024-1.608A18.45 18.45 0 0110 6zm0 2.886a19.872 19.872 0 002.516 1.393 18.44 18.44 0 01-2.516 2.156 18.44 18.44 0 01-2.516-2.156A19.87 19.87 0 0010 8.886zm0 5.21a18.408 18.408 0 01-5.61-2.185 18.489 18.489 0 012.551-2.152 19.842 19.842 0 001.727 1.448.75.75 0 00.942-1.166 18.37 18.37 0 01-1.518-1.292A18.491 18.491 0 0110 10.28a18.49 18.49 0 012.516 1.393c.524.373 1.023.78 1.518 1.293a.75.75 0 10.942 1.165 19.837 19.837 0 00-1.727-1.448 18.49 18.49 0 002.552-2.152 18.408 18.408 0 01-5.61 2.184c-.175.075-.284.244-.284.431s.11.356.284.431z" clipRule="evenodd" />
                    </svg>
                    Generate Quote Video
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
