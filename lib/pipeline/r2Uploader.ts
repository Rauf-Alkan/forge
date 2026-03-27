import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'

function getS3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId) throw new Error('R2_ACCOUNT_ID is not set')
  if (!accessKeyId) throw new Error('R2_ACCESS_KEY_ID is not set')
  if (!secretAccessKey) throw new Error('R2_SECRET_ACCESS_KEY is not set')

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export async function uploadToR2(jobId: string): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!bucket) throw new Error('R2_BUCKET_NAME is not set')
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
