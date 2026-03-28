import axios from 'axios'
import fs from 'fs'
import https from 'https'
import http from 'http'

// Genre pools per mood — tried in order as fallback chain
const MOOD_TAGS: Record<string, string[]> = {
  energetic: ['electronic', 'rock', 'pop', 'hiphop', 'funk'],
  calm:      ['ambient', 'piano', 'classical', 'lounge', 'jazz'],
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
    // Shuffle for variety, then try each as fallback
    const shuffled = [...tags].sort(() => Math.random() - 0.5)

    for (const tag of shuffled) {
      try {
        const response = await axios.get('https://api.jamendo.com/v3.0/tracks/', {
          params: {
            client_id: clientId,
            format: 'json',
            limit: 50,
            tags: tag,
            fuzzytags: 1,
            order: 'popularity_total',
          },
          timeout: 10000,
        })

        const tracks: Array<{ name: string; audio: string }> =
          response.data?.results ?? []

        if (tracks.length === 0) {
          console.warn(`[${jobId}] Jamendo: no tracks for tag "${tag}", trying next`)
          continue
        }

        const track = tracks[Math.floor(Math.random() * tracks.length)]
        if (!track.audio) {
          console.warn(`[${jobId}] Jamendo: track has no audio URL, trying next`)
          continue
        }

        console.log(`[${jobId}] Jamendo track: "${track.name}" (tag: ${tag})`)
        return streamToFile(track.audio, outputPath, jobId)
      } catch (err) {
        console.error(
          `[${jobId}] Jamendo API error for tag "${tag}":`,
          err instanceof Error ? err.message : err
        )
        continue
      }
    }

    console.warn(`[${jobId}] Jamendo: all tags exhausted, skipping music`)
    return null
  }

  // --- Fallback: static URL ---
  const staticUrl = process.env.BACKGROUND_MUSIC_URL
  if (!staticUrl) return null

  console.log(`[${jobId}] Using static background music URL`)
  return streamToFile(staticUrl, outputPath, jobId)
}
