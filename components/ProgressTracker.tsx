'use client'

import type { JobStatus } from '@/lib/jobStore'

type Props = {
  jobStatus: JobStatus
  onReset: () => void
}

const STEPS = [
  {
    step: 1,
    label: 'Writing script',
    desc: 'GPT-4o-mini crafting your hook',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  {
    step: 2,
    label: 'Generating voice',
    desc: 'ElevenLabs synthesizing audio',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    step: 3,
    label: 'Fetching visuals',
    desc: 'Pulling cinematic footage from Pexels',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
  {
    step: 4,
    label: 'Creating subtitles',
    desc: 'Whisper transcribing audio to SRT',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    step: 5,
    label: 'Assembling video',
    desc: 'FFmpeg compositing final output',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5H4v2h1V5zM4 9H3v2h1V9zm0 4H3v2h1v-2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
]

export default function ProgressTracker({ jobStatus, onReset }: Props) {
  const { currentStep, progress, stepName, status, error } = jobStatus

  if (status === 'failed') {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-400">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-red-300 font-semibold text-sm">Pipeline Failed</p>
              <p className="text-red-400/80 text-xs mt-1 leading-relaxed">
                {error ?? 'An unknown error occurred'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/[0.06] text-gray-300 font-semibold rounded-xl px-4 py-3 text-sm transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 font-medium">{stepName}</span>
          <span className="text-xs text-gray-600 tabular-nums font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
              boxShadow: '0 0 12px rgba(96,165,250,0.5)',
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="card-border">
        <div className="bg-[#0a0d14] rounded-2xl divide-y divide-white/[0.04]">
          {STEPS.map(({ step, label, desc, icon }) => {
            const isCompleted = currentStep > step
            const isActive = currentStep === step

            return (
              <div
                key={step}
                className={`flex items-center gap-4 px-5 py-4 transition-all duration-300 first:rounded-t-2xl last:rounded-b-2xl ${
                  isActive ? 'step-active-glow bg-blue-950/20' : ''
                }`}
              >
                {/* Step number / status */}
                <div className="relative flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="w-3.5 h-3.5 text-emerald-400"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-600/50 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-700">
                      <span className="text-[11px] font-medium">{step}</span>
                    </div>
                  )}
                </div>

                {/* Icon + label */}
                <div
                  className={`flex items-center gap-2 min-w-0 flex-1 ${
                    isCompleted
                      ? 'text-gray-500'
                      : isActive
                      ? 'text-blue-300'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{label}</p>
                    {isActive && (
                      <p className="text-[11px] text-blue-500/70 mt-1 leading-none">{desc}</p>
                    )}
                  </div>
                </div>

                {/* Right status badge */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[10px] font-medium text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full animate-pulse">
                      Active
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
