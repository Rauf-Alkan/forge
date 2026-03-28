import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'

function escapeDrawtextText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
}

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
  musicPath: string | null = null,
  hook?: string
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

  // Subtitle style — TikTok: large bold font, thick outline, higher position
  const subtitleStyle = [
    'FontName=DejaVu Sans',
    'FontSize=22',
    'Bold=1',
    'PrimaryColour=&H00FFFFFF',
    'OutlineColour=&H00000000',
    'Outline=3',
    'Shadow=2',
    'Alignment=2',
    'MarginL=40',
    'MarginR=40',
    'MarginV=120',
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

  // Hook card: large centered text overlay for first 0.6s
  const hookCardFilter = hook ? (() => {
    const fontPath = '/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf'
    const words = hook.split(' ')
    const lines: string[] = []
    for (let i = 0; i < words.length; i += 4) {
      lines.push(words.slice(i, i + 4).join(' '))
    }
    const text = lines.map(escapeDrawtextText).join('\\n')
    return `,drawtext=enable='lte(t,0.6)':fontfile=${fontPath}:text='${text}':fontsize=68:fontcolor=white:x=(w-tw)/2:y=(h-th)/2:line_spacing=12:box=1:boxcolor=black@0.65:boxborderw=24`
  })() : ''

  // Apply color grading + effects + hook card + subtitles
  const effectsFilter =
    `[vcat]setsar=1,` +
    `eq=brightness=0.02:contrast=1.08:saturation=0.85,` +
    `curves=r='0/0 0.5/0.48 1/1':g='0/0 0.5/0.5 1/0.95':b='0/0 0.5/0.52 1/1'` +
    hookCardFilter + `,` +
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
        `[${audioIdx}:a]loudnorm=I=-14:TP=-1.5:LRA=11[voice]`,
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
        `[${audioIdx}:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
      ]

      cmd
        .complexFilter(filters)
        .outputOptions([...outputOptions, '-map [a]'])
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
