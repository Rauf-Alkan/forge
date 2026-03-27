import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) {
    return NextResponse.json({ error: 'Server misconfigured: APP_PASSWORD not set' }, { status: 500 })
  }

  if (password !== appPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = Buffer.from(appPassword).toString('base64')
  return NextResponse.json({ token })
}
