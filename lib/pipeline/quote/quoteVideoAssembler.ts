import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'

const FONT_FILE = '/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf'
const VIDEO_DURATION = 20

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\u2019") // replace straight quote with curly to avoid escaping issues
    .replace(/:/g, '\\:')
}

function splitIntoLines(text: string, maxChars = 18): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if (current.length === 0) {
      current = word
    } else if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function assembleQuoteVideo(
  jobId: string,
  imagePath: string,
  quote: string,
  author: string,
  musicPath: string | null = null
): Promise<string> {
  const outputPath = `/tmp/quote_${jobId}.mp4`

  if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`)

  const quoteLines = splitIntoLines(quote, 18)
  const fontSize = 58
  const lineHeight = 75
  const authorFontSize = 36
  const totalTextHeight = quoteLines.length * lineHeight + 20 + authorFontSize
  const startY = Math.floor((1920 - totalTextHeight) / 2)
  const boxPad = 50

  const drawtextFilters: string[] = [
    // semi-transparent dark overlay behind text
    `drawbox=x=0:y=${startY - boxPad}:w=iw:h=${totalTextHeight + boxPad * 2}:color=black@0.55:t=fill`,
    // quote lines
    ...quoteLines.map(
      (line, i) =>
        `drawtext=fontfile='${FONT_FILE}':text='${escapeDrawtext(line)}':fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=${startY + i * lineHeight}:shadowx=2:shadowy=2:shadowcolor=black@0.8`
    ),
    // author
    `drawtext=fontfile='${FONT_FILE}':text='${escapeDrawtext('— ' + author)}':fontsize=${authorFontSize}:fontcolor=white@0.75:x=(w-text_w)/2:y=${startY + quoteLines.length * lineHeight + 20}:shadowx=1:shadowy=1:shadowcolor=black@0.6`,
  ]

  const videoFilter =
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,` +
    `crop=1080:1920,` +
    `eq=brightness=-0.08:contrast=1.1:saturation=1.1,` +
    drawtextFilters.join(',') +
    `[v]`

  await new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .addInputOption('-framerate', '25')

    const outputOptions = [
      '-map [v]',
      '-c:v libx264',
      '-preset fast',
      '-crf 23',
      '-pix_fmt yuv420p',
      `-t ${VIDEO_DURATION}`,
      '-movflags +faststart',
    ]

    if (musicPath && fs.existsSync(musicPath)) {
      cmd.input(musicPath)

      cmd
        .complexFilter([
          videoFilter,
          `[1:a]volume=0.25,afade=t=in:st=0:d=2,afade=t=out:st=${VIDEO_DURATION - 2}:d=2[a]`,
        ])
        .outputOptions([...outputOptions, '-map [a]', '-c:a aac', '-b:a 192k'])
    } else {
      cmd
        .complexFilter([videoFilter])
        .outputOptions([...outputOptions, '-an'])
    }

    cmd
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err, _stdout, stderr) =>
        reject(new Error(`${err.message}\nFFmpeg stderr: ${stderr}`))
      )
      .run()
  })

  const tempFiles = [imagePath]
  if (musicPath) tempFiles.push(musicPath)
  for (const f of tempFiles) {
    try { fs.unlinkSync(f) } catch { /* ignore */ }
  }

  return outputPath
}
