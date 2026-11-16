import { z } from 'zod'

export const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
})

export const registration = credentials.extend({
  name: z.string().trim().min(1).max(80),
})

export function safeNext(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}
