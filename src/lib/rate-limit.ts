import 'server-only'
import { headers } from 'next/headers'
import { consume } from './db/queries/rate-limit'

async function clientId(): Promise<string> {
  const requestHeaders = await headers()
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || requestHeaders.get('x-real-ip') || 'unknown'
}

export const throttled = 'Too many attempts. Wait a minute and try again.'

export async function limitAttempts(action: string, max = 5): Promise<boolean> {
  const { allowed } = await consume(`action:${action}:${await clientId()}`, { window: 60, max })
  return allowed
}
