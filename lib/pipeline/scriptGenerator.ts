import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type ScriptResult = {
  script: string
  hook: string
  keywords: string[]
  title: string
  hashtags: string[]
}

export async function generateScript(topic: string): Promise<ScriptResult> {
  const systemPrompt =
    'You are an expert viral TikTok scriptwriter specializing in motivation, wealth mindset, and financial freedom content. You study accounts like @millionaire_mentor, @wealthpsychology, and similar creators with millions of followers. You understand that the most viral motivation content triggers a psychological identity shift — the viewer must feel like they are being spoken to directly, that this video found THEM. You use contrast (poor mindset vs rich mindset), urgency, and visceral imagery. You never use filler words. Every word earns its place.'

  const userPrompt = `Create a 28-33 second faceless motivation/wealth TikTok script about: ${topic}

Script structure:
- Line 1: PATTERN INTERRUPT hook — shocking, identity-challenging, or forbidden knowledge (max 8 words). Examples: "Nobody tells poor people this secret.", "The rich do this every single day.", "Stop being broke. Here is why."
- Lines 2-4: Build the problem or contrast (poor mindset vs rich mindset, or shocking truth)
- Line 5 (re-hook ~15s mark): Pivot line that makes viewer stay — "But here is what they never show you." or similar
- Lines 6-8: The revelation, the mindset shift, the insight
- Last line: Urgency CTA — "Save this. Your future self will thank you." or "Most people will scroll past this." or similar

Rules:
- Maximum 8 words per sentence
- Use "you" directly — talk TO the viewer
- One concrete statistic or fact about wealth/success
- Dark, cinematic, aspirational tone — not cheesy
- Total: 60-70 words

Return ONLY raw JSON, no markdown backticks, no explanation:
{
  "script": "complete script text",
  "hook": "first sentence only",
  "keywords": ["cinematic keyword 1", "cinematic keyword 2", "cinematic keyword 3", "cinematic keyword 4"],
  "title": "video title under 60 chars",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}

Keywords must be English, cinematic, luxury or dark-aspirational. 2-4 words each.
Example good keywords: "luxury penthouse night", "businessman walking city", "sports car rain", "skyscraper rooftop view", "cash money close up", "private jet interior", "man suit thinking", "city lights aerial"
Hashtags should include: #motivation #wealth #mindset #success #fyp`

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from OpenAI')

      // Strip markdown backticks if GPT wraps response in code block
      const raw = content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()

      const result = JSON.parse(raw) as ScriptResult
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError ?? new Error('Failed to generate script after 3 attempts')
}
