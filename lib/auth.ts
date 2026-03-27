export function checkPassword(password: string): boolean {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) return false
  return password === appPassword
}

export function generateToken(): string {
  return crypto.randomUUID()
}

export function verifyToken(token: string): boolean {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) return false
  const expected = Buffer.from(appPassword).toString('base64')
  return token === expected
}
