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

  // Filter to videos with valid file lists
  const valid = videos.filter(
    (v) => v.video_files && v.video_files.length > 0
  )
  if (valid.length === 0) return null

  const filtered = valid.filter(
    (v) => v.duration >= 3 && v.duration <= 7
  )

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
  jobId: string
): Promise<string[]> {
  const FALLBACK = 'dark cinematic background'

  const downloadTasks = keywords.map(async (keyword, index) => {
    let video = await searchPexels(keyword)

    if (!video) {
      video = await searchPexels(FALLBACK)
    }

    if (!video) {
      throw new Error(`No video found for keyword: "${keyword}" or fallback`)
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
