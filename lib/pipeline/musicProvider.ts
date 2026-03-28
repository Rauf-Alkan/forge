import axios from 'axios'
import fs from 'fs'
import https from 'https'
import http from 'http'

// Tag pools per mood — randomly sampled each call for variety
const MOOD_TAGS: Record<string, string[]> = {
  energetic: ['cinematic', 'motivation', 'epic', 'inspiring', 'upbeat'],
  calm:      ['ambient', 'piano', 'peaceful', 'relaxing', 'background'],
}

async function streamToFile(url: string, destPath: string, jobId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol
      .get(url, (res) => {
        res.pipe(file)
        file.on('finish', () => { file.close(); resolve(destPath) })
      })
      .on('error', (err) => {
        try { fs.unlinkSync(destPath) } catch { /* ignore */ }
        console.error(`[${jobId}] Music stream error:`, err.message)
        resolve(null)
      })
  })
}

export async function downloadMusic(
  jobId: string,
  mood: 'energetic' | 'calm' = 'energetic'
): Promise<string | null> {
  const clientId = process.env.JAMENDO_CLIENT_ID
  const outputPath = `/tmp/music_${jobId}.mp3`

  // --- Jamendo path ---
  if (clientId) {
    const tags = MOOD_TAGS[mood]
    const tag = tags[Math.floor(Math.random() * tags.length)]

    try {
      const response = await axios.get('https://api.jamendo.com/v3.0/tracks/', {
        params: {
          client_id: clientId,
          format: 'json',
          limit: 20,
          audioformat: 'mp31',
          tags: tag,
          fuzzytags: 1,
          order: 'popularity_total',
          audiodownload_allowed: true,
        },
        timeout: 10000,
      })

      const tracks: Array<{ name: string; audiodownload: string; audio: string }> =
        response.data?.results ?? []

      if (tracks.length === 0) {
        console.warn(`[${jobId}] Jamendo: no tracks for tag "${tag}", skipping music`)
        return null
      }

      const track = tracks[Math.floor(Math.random() * tracks.length)]
      const url = track.audiodownload || track.audio

      if (!url) {
        console.warn(`[${jobId}] Jamendo: track has no download URL, skipping music`)
        return null
      }

      console.log(`[${jobId}] Jamendo track: "${track.name}" (tag: ${tag})`)
      return streamToFile(url, outputPath, jobId)
    } catch (err) {
      console.error(
        `[${jobId}] Jamendo API error, skipping music:`,
        err instanceof Error ? err.message : err
      )
      return null
    }
  }

  // --- Fallback: static URL ---
  const staticUrl = process.env.BACKGROUND_MUSIC_URL
  if (!staticUrl) return null

  console.log(`[${jobId}] Using static background music URL`)
  return streamToFile(staticUrl, outputPath, jobId)
}
