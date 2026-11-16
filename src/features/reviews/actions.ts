'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/session'
import { saveReview, voteOnReview } from '@/lib/db/queries/reviews'
import { limitAttempts, throttled } from '@/lib/rate-limit'
import { review, reviewVote } from './schemas'
import { succeeded, type ActionState } from '@/lib/action-state'

export type ReviewState = ActionState<{ needsLogin?: boolean }>

export async function submitReview(_previous: ReviewState, formData: FormData): Promise<ReviewState> {
  const session = await getSession()
  if (!session) return { needsLogin: true }

  const parsed = review.safeParse({
    productId: formData.get('productId'),
    rating: formData.get('rating'),
    body: formData.get('body'),
  })
  if (!parsed.success) return { error: 'Choose a rating and write a few words.' }

  if (!(await limitAttempts('review', 10))) return { error: throttled }

  await saveReview(session.user.id, parsed.data.productId, parsed.data.rating, parsed.data.body)
  revalidatePath(`/products/${formData.get('slug')}`)
  return succeeded()
}

type VoteState = ActionState<{ needsLogin?: boolean }>

export async function voteOnHelpfulness(
  productId: number,
  reviewUserId: string,
  helpful: boolean | null,
): Promise<VoteState> {
  const session = await getSession()
  if (!session) return { needsLogin: true }

  const parsed = reviewVote.safeParse({ productId, reviewUserId, helpful })
  if (!parsed.success) return { error: 'That vote could not be counted.' }

  if (parsed.data.reviewUserId === session.user.id) return { error: 'You cannot vote on your own review.' }

  await voteOnReview(session.user.id, parsed.data.reviewUserId, parsed.data.productId, parsed.data.helpful)
  return {}
}
