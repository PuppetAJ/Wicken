import { getSession } from '@/lib/auth/session'
import { getOwnReview, listReviews, summarizeReviews } from '@/lib/db/queries/reviews'
import type { ReviewSort } from '@/lib/db/types'
import { ReviewForm } from './review-form'
import { ReviewList } from './review-list'
import { Stars } from './stars'

export async function ProductReviews({ productId, slug, sort }: { productId: number; slug: string; sort: ReviewSort }) {
  const session = await getSession()
  const [reviews, own] = await Promise.all([
    listReviews(productId, { sort, viewerId: session?.user.id }),
    session ? getOwnReview(session.user.id, productId) : null,
  ])

  return (
    <div className="flex flex-col gap-10">
      <ReviewList reviews={reviews} productId={productId} viewerId={session?.user.id} />
      <div className="flex flex-col gap-4 border-t border-olive-950/10 pt-8 dark:border-white/10">
        <h3 className="font-medium text-olive-950 dark:text-white">{own ? 'Your review' : 'Write a review'}</h3>
        <ReviewForm productId={productId} slug={slug} existing={own} signedIn={Boolean(session)} />
      </div>
    </div>
  )
}

export async function RatingSummary({ productId }: { productId: number }) {
  const { count, average } = await summarizeReviews(productId)
  if (count === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm">
      <Stars rating={average} />
      <a href="#reviews" className="text-olive-600 underline underline-offset-4 dark:text-olive-400">
        {average.toFixed(1)} · {count} review{count === 1 ? '' : 's'}
      </a>
    </div>
  )
}
