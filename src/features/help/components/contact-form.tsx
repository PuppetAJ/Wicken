'use client'

import { useActionState } from 'react'
import { Button } from '@/components/elements/button'
import { Label } from '@/components/ui/label'
import { sendMessage, type MessageState } from '../actions'
import { FormError } from '@/components/elements/form-error'
import { Field } from '@/components/elements/field'
import { Honeypot } from '@/components/elements/honeypot'
import { Textarea } from '@/components/ui/textarea'

export function ContactForm({
  name = '',
  email = '',
  waiting = false,
}: {
  name?: string
  email?: string
  waiting?: boolean
}) {
  const [state, action, pending] = useActionState<MessageState, FormData>(sendMessage, undefined)

  if (state?.ok) {
    return (
      <p role="status" className="rounded-xl bg-olive-950/2.5 p-6 text-sm/7 dark:bg-white/5">
        Thank you for reaching out. Somebody reads these every morning, and you'd normally hear back within a day or
        two.
        <br />
        <span className="text-olive-600 dark:text-olive-400">
          Wicken is a portfolio demo, so your message was saved to its database rather than sent anywhere.
        </span>
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Honeypot />

      <fieldset disabled={waiting} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" name="name" required maxLength={80} defaultValue={name} />
          <Field label="Email" name="email" type="email" required maxLength={160} defaultValue={email} />
        </div>

        <div className="grid gap-2.5">
          <Label htmlFor="body">What can we help with?</Label>
          <Textarea
            id="body"
            name="body"
            required
            rows={5}
            minLength={10}
            maxLength={2000}
            placeholder="A repair, a commission, or something that arrived not quite right."
          />
        </div>
      </fieldset>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? 'Sending…' : 'Send'}
      </Button>
    </form>
  )
}
