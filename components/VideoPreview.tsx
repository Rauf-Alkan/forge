'use client'

import { useState } from 'react'
import type { JobStatus } from '@/lib/jobStore'

type Props = {
  jobStatus: JobStatus
  onReset: () => void
}

export default function VideoPreview({ jobStatus, onReset }: Props) {
  const { downloadUrl, title, hashtags, description } = jobStatus
  const [copiedTag, setCopiedTag] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedDesc, setCopiedDesc] = useState(false)

  async function copyTag(tag: string) {
    try {
      await navigator.clipboard.writeText(tag)
      setCopiedTag(tag)
      setTimeout(() => setCopiedTag(null), 1500)
    } catch {
      // clipboard not available
    }
  }

  async function copyDescription() {
    if (!description) return
    try {
      await navigator.clipboard.writeText(description)
      setCopiedDesc(true)
      setTimeout(() => setCopiedDesc(false), 1500)
    } catch {
      // clipboard not available
    }
  }

  async function copyAllTags() {
    if (!hashtags) return
    try {
      await navigator.clipboard.writeText(hashtags.join(' '))
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1500)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Success card */}
      <div className="relative overflow-hidden card-border">
        <div className="bg-[#0a0d14] rounded-2xl px-6 py-8 text-center">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent pointer-events-none rounded-2xl" />

          <div className="relative">
            {/* Checkmark */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700/30 mb-4 animate-pulse-green shadow-[0_0_30px_-6px_rgba(16,185,129,0.4)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-emerald-400"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white">Video Ready</h2>
            {title && (
              <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                {title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-[#0a0d14] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">TikTok Description</span>
            <button
              onClick={copyDescription}
              className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              {copiedDesc ? (
                <span className="text-emerald-500">Copied!</span>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H4zm4 1.5A1.5 1.5 0 106 5v6a1.5 1.5 0 003 0V5A1.5 1.5 0 008 3.5z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      )}

      {/* Hashtags */}
      {hashtags && hashtags.length > 0 && (
        <div className="bg-[#0a0d14] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Hashtags</span>
            <button
              onClick={copyAllTags}
              className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              {copiedAll ? (
                <span className="text-emerald-500">Copied all!</span>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H4zm4 1.5A1.5 1.5 0 106 5v6a1.5 1.5 0 003 0V5A1.5 1.5 0 008 3.5z" />
                  </svg>
                  Copy all
                </>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => copyTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  copiedTag === tag
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-gray-200 border border-white/[0.06]'
                }`}
              >
                {copiedTag === tag ? '✓ ' : ''}{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2.5">
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="btn-shimmer flex items-center justify-center gap-2 w-full text-white font-semibold rounded-xl px-4 py-3.5 text-sm transition-all duration-300 shadow-glow-blue"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.75.75v7.69l2.72-2.72a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 111.06-1.06l2.72 2.72V3.75A.75.75 0 0110 3zm-6.75 12a.75.75 0 000 1.5h13.5a.75.75 0 000-1.5H3.25z"
                clipRule="evenodd"
              />
            </svg>
            Download Video
          </a>
        )}

        <button
          onClick={onReset}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 hover:text-gray-200 font-semibold rounded-xl px-4 py-3 text-sm transition-all"
        >
          Generate Another Video
        </button>
      </div>
    </div>
  )
}
