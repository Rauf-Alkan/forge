import { NextResponse } from 'next/server'

export async function GET() {
  const appPassword = process.env.APP_PASSWORD
  const hasPassword = !!appPassword
  const passwordLength = appPassword?.length ?? 0
  const expectedToken = appPassword ? Buffer.from(appPassword).toString('base64') : null

  return NextResponse.json({
    hasPassword,
    passwordLength,
    expectedToken,
  })
}
