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

export async function fetchImage(keyword: string, jobId: string): Promise<string> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) throw new Error('PEXELS_API_KEY is not set')

  const response = await axios.get<PexelsPhotoResponse>(
    'https://api.pexels.com/v1/search',
    {
      headers: { Authorization: apiKey },
      params: {
        query: keyword,
        orientation: 'portrait',
        per_page: 10,
      },
    }
  )

  const photos = response.data.photos
  if (!photos || photos.length === 0) {
    throw new Error(`No image found for keyword: "${keyword}"`)
  }

  const photo = photos[Math.floor(Math.random() * Math.min(5, photos.length))]
  const imageUrl = photo.src.portrait || photo.src.large

  const destPath = `/tmp/image_${jobId}.jpg`

  const imageResponse = await axios.get<NodeJS.ReadableStream>(imageUrl, {
    responseType: 'stream',
  })

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath)
    imageResponse.data.pipe(writer)
    writer.on('finish', () => resolve(destPath))
    writer.on('error', reject)
  })
}
