import 'server-only'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_test_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
})

// A blank key in .env arrives as '', which zod's .optional() does not treat as absent.
const blankIsAbsent = (value: string | undefined) => (value === '' ? undefined : value)

const parsed = schema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_DATABASE_URL
      : (blankIsAbsent(process.env.APP_DATABASE_URL) ?? process.env.DATABASE_URL),
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID: blankIsAbsent(process.env.GOOGLE_CLIENT_ID),
  GOOGLE_CLIENT_SECRET: blankIsAbsent(process.env.GOOGLE_CLIENT_SECRET),
  STRIPE_SECRET_KEY: blankIsAbsent(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: blankIsAbsent(process.env.STRIPE_WEBHOOK_SECRET),
})

if (!parsed.success) {
  console.error('Invalid environment:', z.treeifyError(parsed.error))
  throw new Error('Invalid environment')
}

export const env = parsed.data

export const stripeEnabled = Boolean(env.STRIPE_SECRET_KEY)

export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
