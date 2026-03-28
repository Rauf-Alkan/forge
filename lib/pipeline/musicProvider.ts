import fs from 'fs'
import https from 'https'
import http from 'http'

export async function downloadMusic(jobId: string): Promise<string | null> {
  const musicUrl = process.env.BACKGROUND_MUSIC_URL
  if (!musicUrl) return null

  const outputPath = `/tmp/music_${jobId}.mp3`

  return new Promise((resolve, reject) => {
    const protocol = musicUrl.startsWith('https') ? https : http
    const file = fs.createWriteStream(outputPath)

    protocol
      .get(musicUrl, (res) => {
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(outputPath)
        })
      })
      .on('error', (err) => {
        fs.unlink(outputPath, () => {})
        console.error(`[${jobId}] Music download failed, continuing without music:`, err.message)
        resolve(null)
      })
  })
}
