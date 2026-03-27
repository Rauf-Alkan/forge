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
  console.log(`[${jobId}] Pipeline started — topic: "${topic}"`)

  // ADIM 1 — Script
  console.log(`[${jobId}] Step 1: Generating script...`)
  updateJob(jobId, { status: 'processing', currentStep: 1, stepName: 'Writing script...', progress: 5 })
  const scriptResult = await generateScript(topic)
  console.log(`[${jobId}] Step 1 done — title: "${scriptResult.title}", keywords: ${scriptResult.keywords.join(', ')}`)
  updateJob(jobId, { progress: 20 })

  // ADIM 2 — Voice
  console.log(`[${jobId}] Step 2: Generating voice...`)
  updateJob(jobId, { currentStep: 2, stepName: 'Generating voice...', progress: 20 })
  await generateVoice(scriptResult.script, jobId)
  console.log(`[${jobId}] Step 2 done`)
  updateJob(jobId, { progress: 40 })

  // ADIM 3 — Visuals
  console.log(`[${jobId}] Step 3: Fetching videos from Pexels...`)
  updateJob(jobId, { currentStep: 3, stepName: 'Fetching visuals...', progress: 40 })
  const videoPaths = await fetchVideos(scriptResult.keywords, jobId)
  console.log(`[${jobId}] Step 3 done — downloaded ${videoPaths.length} videos: ${videoPaths.join(', ')}`)
  updateJob(jobId, { progress: 60 })

  // ADIM 4 — Subtitles
  console.log(`[${jobId}] Step 4: Generating subtitles...`)
  updateJob(jobId, { currentStep: 4, stepName: 'Creating subtitles...', progress: 60 })
  await generateSubtitles(jobId)
  console.log(`[${jobId}] Step 4 done`)
  updateJob(jobId, { progress: 75 })

  // ADIM 5 — Assemble
  console.log(`[${jobId}] Step 5: Assembling video with ffmpeg...`)
  updateJob(jobId, { currentStep: 5, stepName: 'Assembling video...', progress: 75 })
  await assembleVideo(jobId, videoPaths)
  console.log(`[${jobId}] Step 5 done`)
  updateJob(jobId, { progress: 90 })

  // ADIM 6 — Upload
  console.log(`[${jobId}] Step 6: Uploading to R2...`)
  updateJob(jobId, { stepName: 'Uploading...', progress: 90 })
  const downloadUrl = await uploadToR2(jobId)
  console.log(`[${jobId}] Step 6 done — url: ${downloadUrl}`)

  updateJob(jobId, { status: 'completed', progress: 100, downloadUrl, title: scriptResult.title, hashtags: scriptResult.hashtags })
  console.log(`[${jobId}] Pipeline completed successfully`)
}
