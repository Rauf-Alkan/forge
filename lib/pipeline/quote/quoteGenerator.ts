import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type QuoteResult = {
  quote: string
  author: string
  authorTitle: string
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
        content: `You are a curator of powerful quotes for global English-speaking entrepreneurship and wealth mindset content.

RULES:
- Real, verifiable authors only — NO Anonymous, NO "Ancient Proverb"
- Maximum 12 words
- Timeless insight — relevant in any decade
- Must be quotable without cultural context

PREFERRED AUTHOR POOL:
Entrepreneurs: Jeff Bezos, Elon Musk, Steve Jobs, Naval Ravikant, Paul Graham, Sam Altman, Peter Thiel
Investors: Charlie Munger, Warren Buffett, Ray Dalio
Philosophers: Marcus Aurelius, Seneca, Epictetus
Athletes: Kobe Bryant, Michael Jordan, Serena Williams
Modern thinkers: James Clear, Alex Hormozi, Gary Vaynerchuk

OVERUSED — AVOID THESE AUTHORS:
- Tony Robbins (oversaturated)
- Generic Einstein misquotes
- Any "Ancient Chinese Proverb"

UNIQUENESS: You will receive a list of already-used quotes.
Never repeat them or use the same author twice in a row.`,
      },
      {
        role: 'user',
        content: `Generate a powerful motivational quote about: ${topic}${exclusionNote}

Return ONLY raw JSON, no markdown:
{
  "quote": "quote text, max 12 words",
  "author": "Full Name (never Anonymous or Unknown)",
  "authorTitle": "short title e.g. 'Investor & Berkshire Hathaway CEO'",
  "imageKeyword": "3-4 word Pexels search matching quote mood"
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

  // Fallback: if GPT still returns Anonymous/Unknown, strip the author
  if (
    !result.author ||
    result.author.toLowerCase().includes('anonymous') ||
    result.author.toLowerCase().includes('unknown')
  ) {
    result.author = ''
    result.authorTitle = ''
  }

  return result
}
