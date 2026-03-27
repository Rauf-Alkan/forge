import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'

function getS3Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY
  const secretAccessKey = process.env.R2_SECRET_KEY

  if (!endpoint) throw new Error('R2_ENDPOINT is not set')
  if (!accessKeyId) throw new Error('R2_ACCESS_KEY is not set')
  if (!secretAccessKey) throw new Error('R2_SECRET_KEY is not set')

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export async function uploadToR2(jobId: string): Promise<string> {
  const bucket = process.env.R2_BUCKET
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!bucket) throw new Error('R2_BUCKET is not set')
  if (!publicUrl) throw new Error('R2_PUBLIC_URL is not set')

  const filePath = `/tmp/final_${jobId}.mp4`
  const key = `forge_${jobId}.mp4`

  const fileBuffer = fs.readFileSync(filePath)

  const client = getS3Client()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: 'video/mp4',
    })
  )

  try {
    fs.unlinkSync(filePath)
  } catch {
    // ignore
  }

  return `${publicUrl}/${key}`
}
