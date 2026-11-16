'use client'

import { Trash2Icon } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { removeReview, type AdminState } from '../actions'

export function ReviewRemover({ userId, productId, author }: { userId: string; productId: number; author: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(removeReview, undefined)

  useEffect(() => {
    if (state?.ok) toast.success('Review removed')
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Remove the review by ${author}`}
        className="inline-flex size-8 items-center justify-center rounded-full text-olive-600 hover:bg-olive-950/10 hover:text-red-700 disabled:opacity-40 dark:text-olive-400 dark:hover:bg-white/10 dark:hover:text-red-400"
      >
        <Trash2Icon className="size-4" />
      </button>
    </form>
  )
}
