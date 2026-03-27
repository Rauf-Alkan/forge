import OpenAI from 'openai'
import fs from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateSubtitles(jobId: string): Promise<string> {
  const audioPath = `/tmp/audio_${jobId}.mp3`
  const outputPath = `/tmp/subtitles_${jobId}.srt`

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'srt',
  })

  fs.writeFileSync(outputPath, transcription as unknown as string)

  return outputPath
}
