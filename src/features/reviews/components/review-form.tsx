'use client'

import { StarIcon } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/elements/button'
import { submitReview, type ReviewState } from '../actions'
import { Textarea } from '@/components/ui/textarea'

export function ReviewForm({
  productId,
  slug,
  existing,
  signedIn,
}: {
  productId: number
  slug: string
  existing?: { rating: number; body: string } | null
  signedIn: boolean
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, undefined)
  const [rating, setRating] = useState(existing?.rating ?? 0)

  useEffect(() => {
    if (state?.ok) toast.success('Thank you, your review is up')
    if (state?.error) toast.error(state.error)
  }, [state])

  if (!signedIn || state?.needsLogin) {
    return (
      <p className="text-sm text-olive-600 dark:text-olive-400">
        <Link href={`/login?next=${encodeURIComponent(`/products/${slug}`)}`} className="underline underline-offset-4">
          Log in
        </Link>{' '}
        to leave a review.
      </p>
    )
  }

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-pressed={rating === star}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              className="rounded-full p-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <StarIcon
                className={
                  star <= rating
                    ? 'size-6 fill-olive-500 text-olive-500 dark:fill-olive-400 dark:text-olive-400'
                    : 'size-6 text-olive-300 hover:text-olive-500 dark:text-olive-700 dark:hover:text-olive-400'
                }
              />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="sr-only">Your review</span>
        <Textarea
          name="body"
          required
          maxLength={2000}
          rows={4}
          defaultValue={existing?.body ?? ''}
          placeholder="How does it look, feel, hold up?"
        />
      </label>

      <Button type="submit" size="lg" disabled={pending || rating === 0} className="self-start">
        {pending ? 'Posting…' : existing ? 'Update your review' : 'Post review'}
      </Button>
    </form>
  )
}
