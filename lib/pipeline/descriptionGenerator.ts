import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type VideoDescriptionInput = {
  type: 'video'
  title: string
  hook: string
  hashtags: string[]
}

type QuoteDescriptionInput = {
  type: 'quote'
  quote: string
  author: string
}

type DescriptionInput = VideoDescriptionInput | QuoteDescriptionInput

export async function generateDescription(input: DescriptionInput): Promise<string> {
  const context =
    input.type === 'video'
      ? `Video title: "${input.title}"\nOpening hook: "${input.hook}"\nHashtags: ${input.hashtags.join(' ')}`
      : `Quote: "${input.quote}"${input.author ? `\nAuthor: ${input.author}` : ''}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.85,
    messages: [
      {
        role: 'system',
        content:
          'You write TikTok video descriptions that maximize reach and watch time. You understand the algorithm: the description must contain relevant keywords (for search), create curiosity or urgency, and feel native to TikTok culture. You use 1-2 strategic emojis max. You never use generic filler phrases. The description should be 2-3 short punchy lines total. End with 5-7 hashtags on the last line.',
      },
      {
        role: 'user',
        content: `Write a TikTok description for this content:\n${context}\n\nRules:\n- 2-3 lines max\n- First line: a hook or bold statement that makes someone stop scrolling\n- Second line (optional): add context, contrast, or intrigue\n- Last line: hashtags only (5-7 tags, mix of niche + broad)\n- Use 1-2 emojis max, placed naturally\n- No quotes around the text, no markdown, plain text only\n- Feel raw and authentic, not corporate`,
      },
    ],
  })

  return (response.choices[0]?.message?.content ?? '').trim()
}
