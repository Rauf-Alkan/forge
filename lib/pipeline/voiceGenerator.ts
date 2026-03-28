import fs from 'fs'

export async function generateVoice(script: string, jobId: string): Promise<string> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!voiceId) throw new Error('ELEVENLABS_VOICE_ID is not set')
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set')

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.28,
          similarity_boost: 0.85,
          style: 0.65,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const outputPath = `/tmp/audio_${jobId}.mp3`
  fs.writeFileSync(outputPath, buffer)

  return outputPath
}
