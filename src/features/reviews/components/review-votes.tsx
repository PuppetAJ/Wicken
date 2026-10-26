'use client'

import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { voteOnHelpfulness } from '../actions'

type Tally = { helpful: number; unhelpful: number; own: boolean | null }

function cast(tally: Tally, next: boolean | null): Tally {
  const moved = { ...tally, own: next }
  if (tally.own === true) moved.helpful -= 1
  if (tally.own === false) moved.unhelpful -= 1
  if (next === true) moved.helpful += 1
  if (next === false) moved.unhelpful += 1
  return moved
}

export function ReviewVotes({
  productId,
  reviewUserId,
  author,
  helpful,
  unhelpful,
  own,
}: {
  productId: number
  reviewUserId: string
  author: string
  helpful: number
  unhelpful: number
  own: boolean | null
}) {
  const [tally, apply] = useOptimistic({ helpful, unhelpful, own }, cast)
  const [pending, start] = useTransition()
  const router = useRouter()

  function press(vote: boolean) {
    // The same thumb again clears it, so a misclick is one press to undo.
    const next = tally.own === vote ? null : vote
    start(async () => {
      apply(next)
      const result = await voteOnHelpfulness(productId, reviewUserId, next)
      if (result?.needsLogin) toast.error('Log in to say whether a review helped.')
      else if (result?.error) toast.error(result.error)
      router.refresh()
    })
  }

  const button =
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ' +
    'border-olive-950/15 text-olive-600 hover:border-olive-950/30 hover:text-olive-950 ' +
    'dark:border-white/15 dark:text-olive-400 dark:hover:border-white/30 dark:hover:text-white'
  const on = 'border-olive-950 text-olive-950 dark:border-white dark:text-white'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => press(true)}
        disabled={pending}
        aria-pressed={tally.own === true}
        aria-label={`Helpful, ${author}'s review: ${tally.helpful}`}
        className={`${button} ${tally.own === true ? on : ''}`}
      >
        <ThumbsUpIcon className="size-3.5" />
        <span className="tabular-nums">{tally.helpful}</span>
      </button>
      <button
        type="button"
        onClick={() => press(false)}
        disabled={pending}
        aria-pressed={tally.own === false}
        aria-label={`Not helpful, ${author}'s review: ${tally.unhelpful}`}
        className={`${button} ${tally.own === false ? on : ''}`}
      >
        <ThumbsDownIcon className="size-3.5" />
        <span className="tabular-nums">{tally.unhelpful}</span>
      </button>
      <span className="text-xs text-olive-600 dark:text-olive-400">Was this helpful?</span>
    </div>
  )
}
