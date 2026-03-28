import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type QuoteResult = {
  quote: string
  author: string
  imageKeyword: string
}

export async function generateQuote(topic: string): Promise<QuoteResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content:
          'You are a curator of powerful, viral motivational quotes for entrepreneurship and wealth mindset content. You select or craft quotes that are short, punchy, and deeply resonant. Max 12 words per quote.',
      },
      {
        role: 'user',
        content: `Generate a powerful motivational quote about: ${topic}

Return ONLY raw JSON, no markdown:
{
  "quote": "The quote text, max 12 words",
  "author": "Real or fitting author name",
  "imageKeyword": "2-4 word English keyword for a luxury/aspirational portrait photo (e.g. 'porsche car road', 'luxury office desk', 'city skyline night')"
}`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content ?? ''
  const raw = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  return JSON.parse(raw) as QuoteResult
}
