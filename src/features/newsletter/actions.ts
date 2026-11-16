'use server'

import { subscribe } from '@/lib/db/queries/subscribers'
import { isBot } from '@/lib/honeypot'
import { limitAttempts, throttled } from '@/lib/rate-limit'
import { signup } from './schemas'
import { succeeded, type ActionState } from '@/lib/action-state'

export type SignupState = ActionState<{ already?: boolean }>

export async function joinNewsletter(_previous: SignupState, formData: FormData): Promise<SignupState> {
  if (isBot(formData)) return succeeded()

  const parsed = signup.safeParse({ email: formData.get('email'), source: formData.get('source') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (!(await limitAttempts('subscribe'))) return { error: throttled }

  const fresh = await subscribe(parsed.data.email, parsed.data.source)
  return { ...succeeded(), already: !fresh }
}
