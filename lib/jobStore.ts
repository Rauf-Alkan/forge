import { prisma } from '@/lib/prisma'

export type JobStatus = {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStep: number
  stepName: string
  progress: number
  error?: string
  downloadUrl?: string
  title?: string
  hashtags?: string[]
  description?: string
  createdAt: Date
}

export async function createJob(jobId: string): Promise<void> {
  await prisma.job.create({ data: { jobId } })
}

export async function updateJob(jobId: string, update: Partial<JobStatus>): Promise<void> {
  const { hashtags, ...rest } = update
  await prisma.job.update({
    where: { jobId },
    data: {
      ...rest,
      ...(hashtags !== undefined ? { hashtags } : {}),
    },
  })
}

export async function getJob(jobId: string): Promise<JobStatus | null> {
  const job = await prisma.job.findUnique({ where: { jobId } })
  if (!job) return null
  return {
    jobId: job.jobId,
    status: job.status as JobStatus['status'],
    currentStep: job.currentStep,
    stepName: job.stepName,
    progress: job.progress,
    error: job.error ?? undefined,
    downloadUrl: job.downloadUrl ?? undefined,
    title: job.title ?? undefined,
    hashtags: job.hashtags,
    description: job.description ?? undefined,
    createdAt: job.createdAt,
  }
}
