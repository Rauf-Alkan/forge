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
    'You are an expert viral short-form video scriptwriter specializing in faceless TikTok and YouTube Shorts content. You create scripts that generate millions of views through psychological hooks, surprising facts, and emotional storytelling. You never use filler words.'

  const userPrompt = `Create a 40-45 second faceless video script about: ${topic}

Requirements:
- Line 1 must be a HOOK causing immediate psychological curiosity or shock (max 8 words)
- Use short punchy sentences, maximum 10 words each
- Include one surprising statistic or counterintuitive fact
- Build tension throughout, release at the end
- Last sentence must leave viewer thinking
- Total: 80-100 words

Return ONLY raw JSON, no markdown backticks, no explanation:
{
  "script": "complete script text",
  "hook": "first sentence only",
  "keywords": ["cinematic keyword 1", "cinematic keyword 2", "cinematic keyword 3", "cinematic keyword 4"],
  "title": "video title under 60 chars",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}

Keywords must be: English, visual and cinematic, dark/dramatic mood, 2-4 words each.
Example good keywords: "ancient roman ruins", "storm over ocean", "burning city night", "lone figure walking"`

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
