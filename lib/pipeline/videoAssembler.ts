import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'

function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err)
      const duration = metadata.format.duration
      if (duration === undefined || duration === null) {
        return reject(new Error('Could not determine audio duration'))
      }
      resolve(duration)
    })
  })
}

export async function assembleVideo(
  jobId: string,
  videoPaths: string[]
): Promise<string> {
  const audioPath = `/tmp/audio_${jobId}.mp3`
  const concatPath = `/tmp/concat_${jobId}.txt`
  const subtitlesPath = `/tmp/subtitles_${jobId}.srt`
  const outputPath = `/tmp/final_${jobId}.mp4`

  // ADIM 1 — Dosya kontrolleri
  if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`)
  if (!fs.existsSync(subtitlesPath)) throw new Error(`Subtitles file not found: ${subtitlesPath}`)
  for (const vp of videoPaths) {
    if (!fs.existsSync(vp)) throw new Error(`Video file not found: ${vp}`)
  }

  // ADIM 2 — Audio duration
  const audioDuration = await getAudioDuration(audioPath)

  // ADIM 3 — Concat list
  const concatContent = videoPaths
    .map((p) => `file '${p}'`)
    .join('\n')
  fs.writeFileSync(concatPath, concatContent)

  // ADIM 3 — FFmpeg command
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatPath)
      .inputOptions(['-f concat', '-safe 0'])
      .input(audioPath)
      .complexFilter([
        `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,eq=brightness=-0.06:contrast=1.1:saturation=1.15,subtitles=${subtitlesPath}:force_style='FontName=Arial,FontSize=21,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=130'[v]`,
      ])
      .outputOptions([
        '-map [v]',
        '-map 1:a',
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 192k',
        `-t ${audioDuration}`,
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  })

  // ADIM 5 — Cleanup temp files
  const tempFiles = [
    audioPath,
    concatPath,
    subtitlesPath,
    ...videoPaths,
  ]

  for (const file of tempFiles) {
    try {
      fs.unlinkSync(file)
    } catch {
      // ignore if already gone
    }
  }

  return outputPath
}
