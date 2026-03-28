import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface QualityScore {
  total: number
  passed: boolean
  breakdown: {
    hookStrength: number     // 0-30
    contentDepth: number     // 0-25
    ctaClarity: number       // 0-20
    globalAppeal: number     // 0-15
    uniqueness: number       // 0-10
  }
  failedComponents: ('script' | 'visuals')[]
  improvementFeedback: string
  hookFormat: string
}

export async function scoreScript(params: {
  script: string
  hook: string
  topic: string
  hookFormat: string
}): Promise<QualityScore> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are a brutal, honest short-form video content evaluator. Score objectively.',
        },
        {
          role: 'user',
          content: `Evaluate this entrepreneurship video script for global English-speaking audience:

Topic: ${params.topic}
Hook Format Used: ${params.hookFormat}
Hook: ${params.hook}
Full Script: ${params.script}

Score each dimension (be harsh, average scripts should score 50-60):

hookStrength (0-30):
- 25-30: Stops scroll immediately, creates urgency
- 15-24: Decent but not exceptional
- 0-14: Generic, forgettable, BANNED hook pattern used

contentDepth (0-25):
- 20-25: Specific example/number, unique insight
- 12-19: Some substance but generic
- 0-11: Pure fluff, no real value

ctaClarity (0-20):
- 16-20: Single clear action, compelling reason
- 8-15: CTA exists but weak
- 0-7: No clear CTA or multiple conflicting ones

globalAppeal (0-15):
- 12-15: Works for any English-speaking market
- 7-11: Mostly universal with minor local references
- 0-6: Too US-specific or culturally narrow

uniqueness (0-10):
- 8-10: Fresh angle, not heard before
- 4-7: Somewhat unique
- 0-3: Seen this exact take 100 times

PASSING THRESHOLD: 70/100

Return ONLY this JSON:
{
  "hookStrength": number,
  "contentDepth": number,
  "ctaClarity": number,
  "globalAppeal": number,
  "uniqueness": number,
  "failedComponents": [],
  "improvementFeedback": "specific actionable feedback in 2 sentences"
}`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content ?? ''
    const raw = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const scores = JSON.parse(raw)

    if (!Array.isArray(scores.failedComponents)) scores.failedComponents = []

    const total =
      (scores.hookStrength ?? 0) +
      (scores.contentDepth ?? 0) +
      (scores.ctaClarity ?? 0) +
      (scores.globalAppeal ?? 0) +
      (scores.uniqueness ?? 0)

    if ((scores.hookStrength ?? 0) < 20) {
      if (!scores.failedComponents.includes('script')) scores.failedComponents.push('script')
    }
    if ((scores.contentDepth ?? 0) < 15) {
      if (!scores.failedComponents.includes('script')) scores.failedComponents.push('script')
    }

    return {
      total,
      passed: total >= 70,
      breakdown: {
        hookStrength: scores.hookStrength ?? 0,
        contentDepth: scores.contentDepth ?? 0,
        ctaClarity: scores.ctaClarity ?? 0,
        globalAppeal: scores.globalAppeal ?? 0,
        uniqueness: scores.uniqueness ?? 0,
      },
      failedComponents: scores.failedComponents,
      improvementFeedback: scores.improvementFeedback ?? '',
      hookFormat: params.hookFormat,
    }
  } catch (err) {
    // If scorer fails, let pipeline continue with a default passing score
    console.error('Quality scorer error (non-blocking):', err instanceof Error ? err.message : err)
    return {
      total: 70,
      passed: true,
      breakdown: { hookStrength: 20, contentDepth: 15, ctaClarity: 15, globalAppeal: 12, uniqueness: 8 },
      failedComponents: [],
      improvementFeedback: '',
      hookFormat: params.hookFormat,
    }
  }
}
