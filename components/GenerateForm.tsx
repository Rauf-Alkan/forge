'use client'

import { useState, FormEvent } from 'react'

type Props = {
  onSubmit: (topic: string) => void
}

export default function GenerateForm({ onSubmit }: Props) {
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!topic.trim() || submitting) return
    setSubmitting(true)
    onSubmit(topic.trim())
  }

  const charCount = topic.length
  const isOverLimit = charCount > 500

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-1.5 h-5 rounded-full bg-gradient-to-b from-forge-400 to-forge-600" />
          <h2 className="text-xl font-semibold text-white">New Video</h2>
        </div>
        <p className="text-gray-600 text-sm pl-3.5">
          Describe your topic — the pipeline handles the rest.
        </p>
      </div>

      {/* Form card */}
      <div className="card-border">
        <div className="bg-[#0a0d14] rounded-2xl p-1">
          <form onSubmit={handleSubmit}>
            <textarea
              rows={6}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                'Enter your video topic in English\n\nExamples:\n• Why the Roman Empire really fell\n• Stoicism and the psychology of money\n• Elon Musk\'s daily habits explained'
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
                {charCount} / 500
              </span>
              <span className="text-[11px] text-gray-700">
                Tip: English topics perform 10× better
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.04] mx-4" />

            {/* Submit */}
            <div className="p-3">
              <button
                type="submit"
                disabled={submitting || !topic.trim() || isOverLimit}
                className="btn-shimmer w-full disabled:!bg-none disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all duration-300 shadow-glow-blue disabled:shadow-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                    </svg>
                    Generate Video
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
