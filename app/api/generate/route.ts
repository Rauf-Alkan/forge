import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { verifyToken } from '@/lib/auth'
import { createJob, updateJob } from '@/lib/jobStore'
import { generateScript } from '@/lib/pipeline/scriptGenerator'
import { generateVoice } from '@/lib/pipeline/voiceGenerator'
import { fetchVideos } from '@/lib/pipeline/videoFetcher'
import { generateSubtitles } from '@/lib/pipeline/subtitleGenerator'
import { assembleVideo } from '@/lib/pipeline/videoAssembler'
import { downloadMusic } from '@/lib/pipeline/musicProvider'
import { uploadToR2 } from '@/lib/pipeline/r2Uploader'
import { generateDescription } from '@/lib/pipeline/descriptionGenerator'
import { scoreScript } from '@/lib/pipeline/qualityScorer'
import { getUsedValues, saveUsedValue } from '@/lib/contentHistory'

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
    await createJob(jobId)

    const response = NextResponse.json({ jobId })

    runPipeline(jobId, topic).catch(async (err) => {
      await updateJob(jobId, {
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

  // Load content history for deduplication
  const usedHooks = await getUsedValues('video_hook')
  console.log(`[${jobId}] Loaded ${usedHooks.length} used hooks from history`)

  // ADIM 1 — Script
  console.log(`[${jobId}] Step 1: Generating script...`)
  await updateJob(jobId, { status: 'processing', currentStep: 1, stepName: 'Writing script...', progress: 5 })
  let scriptResult = await generateScript(topic, undefined, usedHooks)
  console.log(`[${jobId}] Step 1 done — hook: "${scriptResult.hook}" (format ${scriptResult.hookFormat})`)

  // QUALITY GATE
  console.log(`[${jobId}] Quality check...`)
  let qualityScore = await scoreScript({
    script: scriptResult.script,
    hook: scriptResult.hook,
    topic,
    hookFormat: scriptResult.hookFormat ?? 'A',
  })
  console.log(`[${jobId}] Quality score: ${qualityScore.total}/100 (passed: ${qualityScore.passed})`)

  const MAX_ATTEMPTS = 2
  let attempts = 0

  while (!qualityScore.passed && attempts < MAX_ATTEMPTS) {
    attempts++
    console.log(`[${jobId}] Quality failed — attempt ${attempts}. Feedback: ${qualityScore.improvementFeedback}`)
    await updateJob(jobId, {
      stepName: `Quality check: ${qualityScore.total}/100. Improving... (${attempts}/${MAX_ATTEMPTS})`,
      progress: 12,
    })
    scriptResult = await generateScript(topic, qualityScore.improvementFeedback, usedHooks)
    qualityScore = await scoreScript({
      script: scriptResult.script,
      hook: scriptResult.hook,
      topic,
      hookFormat: scriptResult.hookFormat ?? 'A',
    })
    console.log(`[${jobId}] Retry ${attempts} quality score: ${qualityScore.total}/100`)
  }

  await updateJob(jobId, { qualityScore: qualityScore.total, retryCount: attempts, progress: 20 })

  // Save hook to history (after quality gate)
  await Promise.all([
    saveUsedValue('video_topic', topic),
    saveUsedValue('video_hook', scriptResult.hook),
  ])

  // ADIM 2 — Voice
  console.log(`[${jobId}] Step 2: Generating voice...`)
  await updateJob(jobId, { currentStep: 2, stepName: 'Generating voice...', progress: 20 })
  await generateVoice(scriptResult.script, jobId)
  console.log(`[${jobId}] Step 2 done`)
  await updateJob(jobId, { progress: 40 })

  // ADIM 3 — Visuals (with semantic enrichment)
  console.log(`[${jobId}] Step 3: Fetching videos from Pexels...`)
  await updateJob(jobId, { currentStep: 3, stepName: 'Fetching visuals...', progress: 40 })
  const videoPaths = await fetchVideos(scriptResult.visualSearchTerms, jobId, scriptResult.script)
  console.log(`[${jobId}] Step 3 done — ${videoPaths.length} videos downloaded`)
  await updateJob(jobId, { progress: 60 })

  // ADIM 4 — Subtitles
  console.log(`[${jobId}] Step 4: Generating subtitles...`)
  await updateJob(jobId, { currentStep: 4, stepName: 'Creating subtitles...', progress: 60 })
  await generateSubtitles(jobId)
  console.log(`[${jobId}] Step 4 done`)
  await updateJob(jobId, { progress: 75 })

  // ADIM 5 — Music + Assemble
  console.log(`[${jobId}] Step 5: Assembling video...`)
  await updateJob(jobId, { currentStep: 5, stepName: 'Assembling video...', progress: 75 })
  const musicPath = await downloadMusic(jobId, 'energetic')
  console.log(`[${jobId}] Music: ${musicPath ?? 'none'}`)
  await assembleVideo(jobId, videoPaths, musicPath)
  console.log(`[${jobId}] Step 5 done`)
  await updateJob(jobId, { progress: 90 })

  // ADIM 6 — Upload
  console.log(`[${jobId}] Step 6: Uploading to R2...`)
  await updateJob(jobId, { currentStep: 6, stepName: 'Uploading...', progress: 90 })
  const downloadUrl = await uploadToR2(jobId)
  console.log(`[${jobId}] Step 6 done — url: ${downloadUrl}`)

  // Description
  console.log(`[${jobId}] Generating TikTok description...`)
  const description = await generateDescription({
    type: 'video',
    title: scriptResult.title,
    hook: scriptResult.hook,
    hashtags: scriptResult.hashtags,
  })
  console.log(`[${jobId}] Description done`)

  await updateJob(jobId, {
    status: 'completed',
    progress: 100,
    downloadUrl,
    title: scriptResult.title,
    hashtags: scriptResult.hashtags,
    description,
  })
  console.log(`[${jobId}] Pipeline completed — quality: ${qualityScore.total}/100, retries: ${attempts}`)
}
