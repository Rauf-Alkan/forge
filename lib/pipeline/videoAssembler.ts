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
  videoPaths: string[],
  musicPath: string | null = null
): Promise<string> {
  const audioPath = `/tmp/audio_${jobId}.mp3`
  const concatPath = `/tmp/concat_${jobId}.txt`
  const subtitlesPath = `/tmp/subtitles_${jobId}.srt`
  const outputPath = `/tmp/final_${jobId}.mp4`

  if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`)
  if (!fs.existsSync(subtitlesPath)) throw new Error(`Subtitles file not found: ${subtitlesPath}`)
  for (const vp of videoPaths) {
    if (!fs.existsSync(vp)) throw new Error(`Video file not found: ${vp}`)
  }

  const audioDuration = await getAudioDuration(audioPath)

  const concatContent = videoPaths.map((p) => `file '${p}'`).join('\n')
  fs.writeFileSync(concatPath, concatContent)

  // Subtitle style — TikTok: big, centered, white with thick black outline
  const subtitleStyle = [
    'FontName=Arial',
    'FontSize=72',
    'Bold=1',
    'PrimaryColour=&H00FFFFFF',
    'OutlineColour=&H00000000',
    'Outline=3',
    'Shadow=0',
    'Alignment=5',
    'MarginV=50',
  ].join(',')

  const videoFilter = [
    '[0:v]scale=1080:1920:force_original_aspect_ratio=increase',
    'crop=1080:1920',
    'setsar=1',
    'eq=brightness=-0.05:contrast=1.2:saturation=1.3:gamma=0.92',
    `subtitles=${subtitlesPath}:force_style='${subtitleStyle}'`,
    '[v]',
  ].join(',')

  await new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(concatPath)
      .inputOptions(['-f concat', '-safe 0'])
      .input(audioPath)

    const outputOptions = [
      '-map [v]',
      '-c:v libx264',
      '-preset fast',
      '-crf 23',
      '-c:a aac',
      '-b:a 192k',
      `-t ${audioDuration}`,
      '-movflags +faststart',
    ]

    if (musicPath && fs.existsSync(musicPath)) {
      cmd.input(musicPath)

      const filters = [
        videoFilter,
        '[1:a]volume=1.0[voice]',
        `[2:a]volume=0.12,afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(0, audioDuration - 2)}:d=2[music]`,
        '[voice][music]amix=inputs=2:duration=first:dropout_transition=2[a]',
      ]

      cmd
        .complexFilter(filters)
        .outputOptions([...outputOptions, '-map [a]'])
    } else {
      cmd
        .complexFilter([videoFilter])
        .outputOptions([...outputOptions, '-map 1:a'])
    }

    cmd
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  })

  const tempFiles = [audioPath, concatPath, subtitlesPath, ...videoPaths]
  if (musicPath) tempFiles.push(musicPath)

  for (const file of tempFiles) {
    try { fs.unlinkSync(file) } catch { /* ignore */ }
  }

  return outputPath
}
