import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { verifyToken } from '@/lib/auth'
import { createJob, updateJob } from '@/lib/jobStore'
import { generateQuote } from '@/lib/pipeline/quote/quoteGenerator'
import { fetchImage } from '@/lib/pipeline/quote/imageFetcher'
import { assembleQuoteVideo } from '@/lib/pipeline/quote/quoteVideoAssembler'
import { downloadMusic } from '@/lib/pipeline/musicProvider'
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
    await createJob(jobId)

    const response = NextResponse.json({ jobId })

    runQuotePipeline(jobId, topic).catch(async (err) => {
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

async function runQuotePipeline(jobId: string, topic: string): Promise<void> {
  console.log(`[${jobId}] Quote pipeline started — topic: "${topic}"`)

  // Step 1 — Generate quote
  console.log(`[${jobId}] Step 1: Generating quote...`)
  await updateJob(jobId, { status: 'processing', currentStep: 1, stepName: 'Generating quote...', progress: 10 })
  const quoteResult = await generateQuote(topic)
  console.log(`[${jobId}] Step 1 done — quote: "${quoteResult.quote}" by ${quoteResult.author}`)
  await updateJob(jobId, { progress: 25 })

  // Step 2 — Fetch image
  console.log(`[${jobId}] Step 2: Fetching image for keyword: "${quoteResult.imageKeyword}"`)
  await updateJob(jobId, { currentStep: 2, stepName: 'Fetching image...', progress: 25 })
  const imagePath = await fetchImage(quoteResult.imageKeyword, jobId)
  console.log(`[${jobId}] Step 2 done — image: ${imagePath}`)
  await updateJob(jobId, { progress: 50 })

  // Step 3 — Download music
  console.log(`[${jobId}] Step 3: Downloading background music...`)
  await updateJob(jobId, { currentStep: 3, stepName: 'Downloading music...', progress: 50 })
  const musicPath = await downloadMusic(jobId)
  console.log(`[${jobId}] Step 3: Music: ${musicPath ?? 'none'}`)
  await updateJob(jobId, { progress: 65 })

  // Step 4 — Assemble video
  console.log(`[${jobId}] Step 4: Assembling quote video...`)
  await updateJob(jobId, { currentStep: 4, stepName: 'Assembling video...', progress: 65 })
  const videoPath = await assembleQuoteVideo(jobId, imagePath, quoteResult.quote, quoteResult.author, musicPath)
  console.log(`[${jobId}] Step 4 done — video: ${videoPath}`)
  await updateJob(jobId, { progress: 85 })

  // Step 5 — Upload
  console.log(`[${jobId}] Step 5: Uploading to R2...`)
  await updateJob(jobId, { stepName: 'Uploading...', progress: 85 })
  const downloadUrl = await uploadToR2(jobId, videoPath)
  console.log(`[${jobId}] Step 5 done — url: ${downloadUrl}`)

  await updateJob(jobId, {
    status: 'completed',
    progress: 100,
    downloadUrl,
    title: `"${quoteResult.quote}" — ${quoteResult.author}`,
    hashtags: ['#motivation', '#quotes', '#mindset', '#success', '#fyp'],
  })
  console.log(`[${jobId}] Quote pipeline completed successfully`)
}
