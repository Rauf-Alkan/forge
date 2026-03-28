import OpenAI from 'openai'
import axios from 'axios'
import fs from 'fs'

type PexelsVideoFile = {
  link: string
  quality: string
  width: number
  height: number
}

type PexelsVideo = {
  duration: number
  video_files: PexelsVideoFile[]
}

type PexelsResponse = {
  videos: PexelsVideo[]
}

async function enrichVisualKeyword(
  rawKeyword: string,
  scriptContext: string,
  sceneIndex: number
): Promise<string[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Video script context: "${scriptContext}"
Scene ${sceneIndex + 1} keyword: "${rawKeyword}"

Generate 3 Pexels video search terms for this specific scene.

Rules:
- English only
- 2-4 words each
- Concrete and visual (no abstract concepts)
- Must return actual video results on Pexels
- Order from most specific to most generic (fallback chain)

VISUAL CONSISTENCY RULE (critical):
- All scenes must feature people in professional/business contexts
- Consistent energy throughout — do NOT mix casual and corporate
- Preferred environments: office, city street, coffee shop meeting, laptop work, phone screen, whiteboard
- BANNED scene types: bedroom, sleeping, beach, vacation, leisure, relaxing
- If topic is about entrepreneurship/money/success → always use people in action, not objects

Convert abstract → concrete:
"failure" → "businessman head down desk"
"success" → "entrepreneur fist pump office"
"hustle" → "person working late night laptop"
"money" → "professional counting cash office"
"growth" → "entrepreneur celebrating phone screen"

Return ONLY a JSON array: ["term1", "term2", "term3"]`,
      }],
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content ?? ''
    const raw = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(raw) as string[]
  } catch {
    return [rawKeyword, 'entrepreneur working office', 'business professional success']
  }
}

async function searchPexels(keyword: string): Promise<PexelsVideo | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) throw new Error('PEXELS_API_KEY is not set')

  const response = await axios.get<PexelsResponse>(
    'https://api.pexels.com/videos/search',
    {
      headers: { Authorization: apiKey },
      params: {
        query: keyword,
        orientation: 'portrait',
        size: 'medium',
        per_page: 15,
      },
    }
  )

  const videos = response.data.videos
  if (!videos || videos.length === 0) return null

  const valid = videos.filter((v) => v.video_files && v.video_files.length > 0)
  if (valid.length === 0) return null

  const filtered = valid.filter((v) => v.duration >= 3 && v.duration <= 7)
  const candidates = filtered.length > 0 ? filtered : valid

  candidates.sort((a, b) => {
    const aFile = getBestFile(a.video_files)
    const bFile = getBestFile(b.video_files)
    if (!aFile || !bFile) return 0
    const aRatio = Math.abs(aFile.width / aFile.height - 0.5625)
    const bRatio = Math.abs(bFile.width / bFile.height - 0.5625)
    return aRatio - bRatio
  })

  return candidates[0] ?? null
}

function getBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  if (!files || files.length === 0) return null
  const hdFiles = files.filter((f) => f.quality === 'hd')
  const pool = hdFiles.length > 0 ? hdFiles : files
  const sorted = [...pool].sort((a, b) => b.width * b.height - a.width * a.height)
  return sorted[0] ?? null
}

async function downloadVideo(url: string, destPath: string): Promise<void> {
  const response = await axios.get<NodeJS.ReadableStream>(url, {
    responseType: 'stream',
  })

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath)
    response.data.pipe(writer)
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

export async function fetchVideos(
  keywords: string[],
  jobId: string,
  scriptContext = ''
): Promise<string[]> {
  const FALLBACK = 'luxury city night'

  const downloadTasks = keywords.map(async (keyword, index) => {
    // Enrich keyword into a fallback chain
    const searchTerms = scriptContext
      ? await enrichVisualKeyword(keyword, scriptContext, index)
      : [keyword, FALLBACK]

    // Try each term in the fallback chain
    let video: PexelsVideo | null = null
    for (const term of searchTerms) {
      video = await searchPexels(term)
      if (video) break
    }

    // Final fallback
    if (!video) video = await searchPexels(FALLBACK)

    if (!video) {
      throw new Error(`No video found for keyword: "${keyword}" or any fallback`)
    }

    const bestFile = getBestFile(video.video_files)
    if (!bestFile) {
      throw new Error(`No downloadable file for keyword: "${keyword}"`)
    }

    const destPath = `/tmp/video_${jobId}_${index}.mp4`
    await downloadVideo(bestFile.link, destPath)
    return destPath
  })

  return Promise.all(downloadTasks)
}
