'use server'

import { getSession } from '@/lib/auth/session'
import { saveMessage } from '@/lib/db/queries/messages'
import { isBot } from '@/lib/honeypot'
import { limitAttempts, throttled } from '@/lib/rate-limit'
import { message } from './schemas'
import { succeeded, type ActionState } from '@/lib/action-state'

export type MessageState = ActionState

export async function sendMessage(_previous: MessageState, formData: FormData): Promise<MessageState> {
  if (isBot(formData)) return succeeded()

  const parsed = message.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    body: formData.get('body'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (!(await limitAttempts('message', 3))) return { error: throttled }

  const session = await getSession()
  await saveMessage(parsed.data.name, parsed.data.email, parsed.data.body, session?.user.id ?? null)
  return succeeded()
}
