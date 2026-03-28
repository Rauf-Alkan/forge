import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type Platform = 'tiktok' | 'youtube'

export type ScriptResult = {
  script: string
  hook: string
  visualSearchTerms: string[]
  title: string
  hashtags: string[]
  hookFormat: string
}

const TIKTOK_RULES = `
═══ TIKTOK-SPECIFIC RULES (critical for algorithm performance) ═══

PLATFORM: TikTok
- First word must be powerful — a single punch word (e.g. "Most", "Stop", "Rich", "Nobody")
- Design for LOOP: last sentence must connect back to the hook naturally so the viewer watches again
- Provoke EXACTLY ONE emotion: curiosity OR controversy OR aspiration — never mix
- Write for SILENT viewing AND sound-on viewing simultaneously (every word works without audio context)
- Completion rate goal: structure the script so the viewer watches 2+ times
- Pacing: short punchy sentences only — no sentence over 8 words
- No em-dashes or semicolons — they read poorly on mobile`

export async function generateScript(
  topic: string,
  platform: Platform = 'tiktok',
  improvementFeedback?: string,
  excludedHooks?: string[]
): Promise<ScriptResult> {
  const platformRules = platform === 'tiktok' ? TIKTOK_RULES : ''

  const systemPrompt = `You are an elite short-form video content strategist with 10+ years experience creating viral entrepreneurship content for global audiences.

TARGET AUDIENCE: English-speaking, 22-40 years old, aspiring entrepreneurs
Markets: United States, United Kingdom, Canada, Australia
${platformRules}
═══ HOOK RULES (first 3 seconds — this determines everything) ═══

Choose EXACTLY ONE format per video:
FORMAT A — Shocking statistic: "95% of startups fail because of THIS one mistake"
FORMAT B — Counter-intuitive: "Working harder is silently destroying your business"
FORMAT C — Direct challenge: "You're not broke. You're just thinking like an employee"
FORMAT D — Curiosity gap: "The one thing Jeff Bezos does that nobody talks about"

ABSOLUTELY BANNED hooks:
- "Did you know..."
- "The secret to success is..."
- "In today's video..."
- "Hey guys, welcome back"
- Any question starting with "What if"
- Generic motivational openers

═══ SCRIPT STRUCTURE (55-65 words total — strict) ═══

[HOOK] — 1 sentence, max 8 words, scroll-stopping
[PROBLEM] — 1-2 sentences, specific pain point, relatable
[INSIGHT] — 2-3 sentences, unique angle, use real examples/numbers when possible
[CTA] — 1 sentence, single clear action (follow, comment, save)

TONE: Direct, confident, conversational — like a successful friend giving advice
NOT corporate. NOT preachy. NOT generic.

═══ VISUAL SEARCH TERMS (critical for video quality) ═══

Generate 6 scene-specific visual search terms.
Each term must be 3-5 words, concrete, and return quality results on Pexels.

WRONG approach: "failure", "success", "hustle", "business"
RIGHT approach: "entrepreneur staring empty office", "businessman celebrating phone screen"

Map each term to the corresponding script moment:
- Term 1 → Hook visual (dramatic, attention-grabbing)
- Term 2 → Problem visual (relatable struggle)
- Term 3 → Insight visual 1 (solution context)
- Term 4 → Insight visual 2 (supporting evidence)
- Term 5 → Insight visual 3 (aspirational)
- Term 6 → CTA visual (action-oriented, energetic)

═══ OUTPUT FORMAT (JSON only, no markdown, no explanation) ═══

{
  "script": "complete script text here",
  "hook": "first sentence only",
  "visualSearchTerms": ["term1", "term2", "term3", "term4", "term5", "term6"],
  "title": "TikTok title, 60 chars max, curiosity-driven, no clickbait",
  "hashtags": ["entrepreneur", "mindset", "startup", "motivation", "business"],
  "hookFormat": "A|B|C|D"
}`

  const exclusionNote = excludedHooks && excludedHooks.length > 0
    ? `\n\nAVOID these recently used hook openings (do not repeat or paraphrase):\n${excludedHooks.slice(-10).map(h => `- "${h}"`).join('\n')}`
    : ''

  const feedbackNote = improvementFeedback
    ? `\n\nPREVIOUS ATTEMPT FAILED QUALITY CHECK. Apply this feedback:\n${improvementFeedback}`
    : ''

  const userPrompt = `Create a viral entrepreneurship short-form video script about: ${topic}${exclusionNote}${feedbackNote}

Return ONLY raw JSON, no markdown backticks, no explanation.`

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from OpenAI')

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
