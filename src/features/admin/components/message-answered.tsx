'use client'

import { CheckIcon, UndoIcon } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { answerMessage, type AdminState } from '../actions'

export function MessageAnswered({ id, answered, from }: { id: number; answered: boolean; from: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(answerMessage, undefined)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="answered" value={String(!answered)} />
      <button
        type="submit"
        disabled={pending}
        aria-label={answered ? `Mark the message from ${from} unanswered` : `Mark the message from ${from} answered`}
        className="inline-flex size-8 items-center justify-center rounded-full text-olive-600 hover:bg-olive-950/10 hover:text-olive-950 disabled:opacity-40 dark:text-olive-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        {answered ? <UndoIcon className="size-4" /> : <CheckIcon className="size-4" />}
      </button>
    </form>
  )
}
