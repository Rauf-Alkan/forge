import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type QuoteResult = {
  quote: string
  author: string
  imageKeyword: string
}

export async function generateQuote(topic: string, excludedQuotes: string[] = []): Promise<QuoteResult> {
  const exclusionNote =
    excludedQuotes.length > 0
      ? `\n\nDo NOT use any of these quotes (already used):\n${excludedQuotes.map((q) => `- "${q}"`).join('\n')}`
      : ''

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content:
          'You are a curator of powerful, viral motivational quotes for entrepreneurship and wealth mindset content. You select or craft quotes that are short, punchy, and deeply resonant. Max 12 words per quote. IMPORTANT: Always attribute quotes to a real, named person (e.g. Marcus Aurelius, Steve Jobs, Napoleon Hill). NEVER use "Anonymous" or "Unknown".',
      },
      {
        role: 'user',
        content: `Generate a powerful motivational quote about: ${topic}${exclusionNote}

Return ONLY raw JSON, no markdown:
{
  "quote": "The quote text, max 12 words",
  "author": "Real named person (never Anonymous or Unknown)",
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

  const result = JSON.parse(raw) as QuoteResult

  // Fallback: if GPT still returns Anonymous, strip the author
  if (!result.author || result.author.toLowerCase().includes('anonymous') || result.author.toLowerCase().includes('unknown')) {
    result.author = ''
  }

  return result
}
