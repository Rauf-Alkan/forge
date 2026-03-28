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
  const subtitlesPath = `/tmp/subtitles_${jobId}.srt`
  const outputPath = `/tmp/final_${jobId}.mp4`

  if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`)
  if (!fs.existsSync(subtitlesPath)) throw new Error(`Subtitles file not found: ${subtitlesPath}`)
  for (const vp of videoPaths) {
    if (!fs.existsSync(vp)) throw new Error(`Video file not found: ${vp}`)
  }

  const audioDuration = await getAudioDuration(audioPath)

  // Subtitle style — TikTok: big, centered, white with thick black outline
  const subtitleStyle = [
    'FontName=DejaVu Sans',
    'FontSize=13',
    'Bold=1',
    'PrimaryColour=&H00FFFFFF',
    'OutlineColour=&H00000000',
    'Outline=2',
    'Shadow=1',
    'Alignment=2',
    'MarginL=30',
    'MarginR=30',
    'MarginV=80',
  ].join('\\,')

  const n = videoPaths.length
  const audioIdx = n       // audio input index
  const musicIdx = n + 1   // music input index (if used)

  // Normalize each clip: consistent resolution, 30fps, reset timestamps
  const clipFilters = videoPaths.map((_, i) =>
    `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setpts=PTS-STARTPTS[v${i}]`
  )

  // Concatenate normalized clips
  const concatInputLabels = videoPaths.map((_, i) => `[v${i}]`).join('')
  const concatFilter = `${concatInputLabels}concat=n=${n}:v=1:a=0[vcat]`

  // Apply effects + subtitles
  const effectsFilter =
    `[vcat]setsar=1,` +
    `eq=brightness=-0.05:contrast=1.2:saturation=1.3,` +
    `subtitles=${subtitlesPath}:force_style='${subtitleStyle}'[v]`

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

  await new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()

    // Add each video clip as a separate input
    for (const vp of videoPaths) {
      cmd.input(vp)
    }
    cmd.input(audioPath)

    if (musicPath && fs.existsSync(musicPath)) {
      cmd.input(musicPath)

      const filters = [
        ...clipFilters,
        concatFilter,
        effectsFilter,
        `[${audioIdx}:a]volume=1.0[voice]`,
        `[${musicIdx}:a]volume=0.12,afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(0, audioDuration - 2)}:d=2[music]`,
        '[voice][music]amix=inputs=2:duration=first:dropout_transition=2[a]',
      ]

      cmd
        .complexFilter(filters)
        .outputOptions([...outputOptions, '-map [a]'])
    } else {
      const filters = [
        ...clipFilters,
        concatFilter,
        effectsFilter,
      ]

      cmd
        .complexFilter(filters)
        .outputOptions([...outputOptions, `-map ${audioIdx}:a`])
    }

    cmd
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err, _stdout, stderr) => reject(new Error(`${err.message}\nFFmpeg stderr: ${stderr}`)))
      .run()
  })

  const tempFiles = [audioPath, subtitlesPath, ...videoPaths]
  if (musicPath) tempFiles.push(musicPath)

  for (const file of tempFiles) {
    try { fs.unlinkSync(file) } catch { /* ignore */ }
  }

  return outputPath
}
