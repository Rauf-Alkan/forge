import { prisma } from '@/lib/prisma'

export type ContentHistoryType = 'quote' | 'image_url' | 'video_topic' | 'video_hook'

export async function getUsedValues(type: ContentHistoryType): Promise<string[]> {
  const rows = await prisma.contentHistory.findMany({
    where: { type },
    select: { value: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => r.value)
}

export async function saveUsedValue(type: ContentHistoryType, value: string): Promise<void> {
  await prisma.contentHistory.create({ data: { type, value } })
}
