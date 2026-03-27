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
  createdAt: Date
}

const jobs = new Map<string, JobStatus>()

export function cleanupOldJobs(): void {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt < twoHoursAgo) {
      jobs.delete(jobId)
    }
  }
}

export function createJob(jobId: string): void {
  cleanupOldJobs()
  jobs.set(jobId, {
    jobId,
    status: 'pending',
    currentStep: 0,
    stepName: 'Initializing...',
    progress: 0,
    createdAt: new Date(),
  })
}

export function updateJob(jobId: string, update: Partial<JobStatus>): void {
  const existing = jobs.get(jobId)
  if (!existing) return
  jobs.set(jobId, { ...existing, ...update })
}

export function getJob(jobId: string): JobStatus | undefined {
  return jobs.get(jobId)
}
