import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { verifyToken } from '@/lib/auth'
import { createJob, updateJob } from '@/lib/jobStore'
import { generateScript } from '@/lib/pipeline/scriptGenerator'
import { generateVoice } from '@/lib/pipeline/voiceGenerator'
import { fetchVideos } from '@/lib/pipeline/videoFetcher'
import { generateSubtitles } from '@/lib/pipeline/subtitleGenerator'
import { assembleVideo } from '@/lib/pipeline/videoAssembler'
import { uploadToR2 } from '@/lib/pipeline/r2Uploader'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-forge-token') ?? ''
    if (!verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const topic: string = body?.topic?.trim() ?? ''

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const jobId = uuidv4()
    createJob(jobId)

    // Return immediately — pipeline runs in background
    const response = NextResponse.json({ jobId })

    runPipeline(jobId, topic).catch((err) => {
      updateJob(jobId, {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
    })

    return response
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function runPipeline(jobId: string, topic: string): Promise<void> {
  // ADIM 1 — Script
  updateJob(jobId, {
    status: 'processing',
    currentStep: 1,
    stepName: 'Writing script...',
    progress: 5,
  })

  const scriptResult = await generateScript(topic)

  updateJob(jobId, { progress: 20 })

  // ADIM 2 — Voice
  updateJob(jobId, {
    currentStep: 2,
    stepName: 'Generating voice...',
    progress: 20,
  })

  await generateVoice(scriptResult.script, jobId)

  updateJob(jobId, { progress: 40 })

  // ADIM 3 — Visuals
  updateJob(jobId, {
    currentStep: 3,
    stepName: 'Fetching visuals...',
    progress: 40,
  })

  const videoPaths = await fetchVideos(scriptResult.keywords, jobId)

  updateJob(jobId, { progress: 60 })

  // ADIM 4 — Subtitles
  updateJob(jobId, {
    currentStep: 4,
    stepName: 'Creating subtitles...',
    progress: 60,
  })

  await generateSubtitles(jobId)

  updateJob(jobId, { progress: 75 })

  // ADIM 5 — Assemble
  updateJob(jobId, {
    currentStep: 5,
    stepName: 'Assembling video...',
    progress: 75,
  })

  await assembleVideo(jobId, videoPaths)

  updateJob(jobId, { progress: 90 })

  // ADIM 6 — Upload
  updateJob(jobId, { stepName: 'Uploading...', progress: 90 })

  const downloadUrl = await uploadToR2(jobId)

  updateJob(jobId, {
    status: 'completed',
    progress: 100,
    downloadUrl,
    title: scriptResult.title,
    hashtags: scriptResult.hashtags,
  })
}
