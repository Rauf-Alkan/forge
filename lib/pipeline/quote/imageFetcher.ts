import axios from 'axios'
import fs from 'fs'

type PexelsPhoto = {
  src: {
    portrait: string
    large: string
  }
}

type PexelsPhotoResponse = {
  photos: PexelsPhoto[]
}

export type FetchImageResult = {
  imagePath: string
  imageUrl: string
}

export async function fetchImage(
  keyword: string,
  jobId: string,
  excludedUrls: string[] = []
): Promise<FetchImageResult> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) throw new Error('PEXELS_API_KEY is not set')

  const response = await axios.get<PexelsPhotoResponse>(
    'https://api.pexels.com/v1/search',
    {
      headers: { Authorization: apiKey },
      params: {
        query: keyword,
        orientation: 'portrait',
        per_page: 15,
      },
    }
  )

  const photos = response.data.photos
  if (!photos || photos.length === 0) {
    throw new Error(`No image found for keyword: "${keyword}"`)
  }

  // Filter out previously used photos
  const available = photos.filter((p) => {
    const url = p.src.portrait || p.src.large
    return !excludedUrls.includes(url)
  })

  const pool = available.length > 0 ? available : photos // fallback to all if all used
  const photo = pool[Math.floor(Math.random() * Math.min(5, pool.length))]
  const imageUrl = photo.src.portrait || photo.src.large

  const destPath = `/tmp/image_${jobId}.jpg`

  const imageResponse = await axios.get<NodeJS.ReadableStream>(imageUrl, {
    responseType: 'stream',
  })

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(destPath)
    imageResponse.data.pipe(writer)
    writer.on('finish', () => resolve())
    writer.on('error', reject)
  })

  return { imagePath: destPath, imageUrl }
}
