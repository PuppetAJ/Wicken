'use client'

import { MailIcon } from 'lucide-react'
import { useActionState, useId, type ReactNode } from 'react'
import { Button } from '@/components/elements/button'
import { Input } from '@/components/ui/input'
import { joinNewsletter, type SignupState } from '../actions'
import { FormError } from '@/components/elements/form-error'
import { Honeypot } from '@/components/elements/honeypot'

export function NewsletterForm({ source, fineprint }: { source: 'footer' | 'landing'; fineprint?: ReactNode }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(joinNewsletter, undefined)
  const id = useId()

  if (state?.ok) {
    return (
      <p role="status" className="text-sm/6 text-olive-950 dark:text-white">
        {state?.already ? "You're already on the list." : "Thanks. We'll write when the next batch is out."}
        <br />
        <span className="text-olive-600 dark:text-olive-400">Wicken is a demo, so nothing is actually sent.</span>
      </p>
    )
  }

  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-3">
      <input type="hidden" name="source" value={source} />
      <Honeypot />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor={id} className="sr-only">
            Email
          </label>
          <MailIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-olive-500"
          />
          <Input
            id={id}
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            placeholder="Your email"
            className="h-11 pl-9"
          />
        </div>
        <Button type="submit" size="lg" disabled={pending} className="h-11 shrink-0 px-5">
          {pending ? 'One moment…' : 'Subscribe'}
        </Button>
      </div>
      {state?.error && <FormError>{state.error}</FormError>}
      {fineprint && <div className="text-xs/5 text-olive-600 dark:text-olive-400">{fineprint}</div>}
    </form>
  )
}
