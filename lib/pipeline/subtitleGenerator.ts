import OpenAI from 'openai'
import fs from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type WordTimestamp = {
  word: string
  start: number
  end: number
}

type VerboseTranscription = {
  words: WordTimestamp[]
}

function toSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

export async function generateSubtitles(jobId: string): Promise<string> {
  const audioPath = `/tmp/audio_${jobId}.mp3`
  const outputPath = `/tmp/subtitles_${jobId}.srt`

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  }) as unknown as VerboseTranscription

  const words = transcription.words
  if (!words || words.length === 0) {
    throw new Error('No word timestamps from Whisper')
  }

  // Group into 3-word chunks for TikTok-style display
  const CHUNK_SIZE = 3
  const chunks: { text: string; start: number; end: number }[] = []

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE)
    chunks.push({
      text: chunk.map((w) => w.word).join(' ').trim(),
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
    })
  }

  const srt = chunks
    .map((c, i) => `${i + 1}\n${toSrtTime(c.start)} --> ${toSrtTime(c.end)}\n${c.text}`)
    .join('\n\n')

  fs.writeFileSync(outputPath, srt)
  return outputPath
}
