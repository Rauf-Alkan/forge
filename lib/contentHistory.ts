import { prisma } from '@/lib/prisma'

export async function getUsedValues(type: 'quote' | 'image_url'): Promise<string[]> {
  const rows = await prisma.contentHistory.findMany({
    where: { type },
    select: { value: true },
  })
  return rows.map((r) => r.value)
}

export async function saveUsedValue(type: 'quote' | 'image_url', value: string): Promise<void> {
  await prisma.contentHistory.create({ data: { type, value } })
}
