'use client'

import { useActionState } from 'react'
import { SoftButton } from '@/components/elements/button'
import { signInAsDemo, type AuthState } from '../actions'
import { FormError } from '@/components/elements/form-error'

export function DemoLogin({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signInAsDemo, undefined)

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="next" value={next} />
      <div className="flex gap-2">
        <SoftButton type="submit" name="role" value="customer" size="lg" disabled={pending} className="flex-1">
          Demo shopper
        </SoftButton>
        <SoftButton type="submit" name="role" value="admin" size="lg" disabled={pending} className="flex-1">
          Demo admin
        </SoftButton>
      </div>
      {state?.error ? <FormError>{state.error}</FormError> : null}
    </form>
  )
}
