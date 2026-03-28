'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { JobStatus } from '@/lib/jobStore'
import GenerateForm from '@/components/GenerateForm'
import QuoteForm from '@/components/QuoteForm'
import ProgressTracker from '@/components/ProgressTracker'
import VideoPreview from '@/components/VideoPreview'

function getToken(): string {
  return localStorage.getItem('forge_token') ?? ''
}

type Tab = 'video' | 'quote'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('video')
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('forge_token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  const pollStatus = useCallback(async () => {
    if (!jobId) return
    try {
      const res = await fetch(`/api/status?jobId=${jobId}`, {
        headers: { 'x-forge-token': getToken() },
      })
      if (!res.ok) return
      const data: JobStatus = await res.json()
      setJobStatus(data)
      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false)
      }
    } catch {
      // ignore network errors during polling
    }
  }, [jobId])

  useEffect(() => {
    if (!isPolling || !jobId) return

    pollStatus()
    const interval = setInterval(pollStatus, 2000)
    return () => clearInterval(interval)
  }, [isPolling, jobId, pollStatus])

  async function handleVideoSubmit(topic: string) {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forge-token': getToken(),
        },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start generation')
      setJobId(data.jobId)
      setJobStatus(null)
      setIsPolling(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start generation')
    }
  }

  async function handleQuoteSubmit(topic: string) {
    try {
      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forge-token': getToken(),
        },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start generation')
      setJobId(data.jobId)
      setJobStatus(null)
      setIsPolling(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start generation')
    }
  }

  function handleReset() {
    setJobId(null)
    setJobStatus(null)
    setIsPolling(false)
  }

  function handleLogout() {
    localStorage.removeItem('forge_token')
    router.push('/')
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    handleReset()
  }

  const showForm = !jobId
  const showProgress = !!jobId && jobStatus?.status !== 'completed'
  const showPreview = jobStatus?.status === 'completed'

  return (
    <div className="relative min-h-screen bg-[#030712] overflow-hidden bg-noise">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-forge-600/8 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-forge-600/10 border border-forge-600/20 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-4 h-4 text-forge-400"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">The Forge</h1>
            <p className="text-[10px] text-gray-600 leading-none mt-0.5 tracking-wider uppercase">Content Engine</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-300 text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.047a.75.75 0 10-1.06-1.061l-2.25 2.25a.75.75 0 000 1.06l2.25 2.25a.75.75 0 101.06-1.06L8.705 10.75H18.25A.75.75 0 0019 10z"
              clipRule="evenodd"
            />
          </svg>
          Logout
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-xl mx-auto px-4 py-10">
        {/* Tabs */}
        {showForm && (
          <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-8">
            <button
              onClick={() => handleTabChange('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'video'
                  ? 'bg-[#0a0d14] text-white shadow-sm border border-white/[0.08]'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
              </svg>
              Video
            </button>
            <button
              onClick={() => handleTabChange('quote')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'quote'
                  ? 'bg-[#0a0d14] text-white shadow-sm border border-white/[0.08]'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.671 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.763.763 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.671-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
              </svg>
              Quote
            </button>
          </div>
        )}

        <div className="animate-fade-in">
          {showForm && activeTab === 'video' && <GenerateForm onSubmit={handleVideoSubmit} />}
          {showForm && activeTab === 'quote' && <QuoteForm onSubmit={handleQuoteSubmit} />}

          {showProgress && jobStatus && (
            <ProgressTracker jobStatus={jobStatus} onReset={handleReset} />
          )}

          {showProgress && !jobStatus && (
            <div className="text-center text-gray-600 py-24">
              <div className="inline-block w-7 h-7 border-2 border-forge-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm">Starting pipeline...</p>
            </div>
          )}

          {showPreview && jobStatus && (
            <VideoPreview jobStatus={jobStatus} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  )
}
