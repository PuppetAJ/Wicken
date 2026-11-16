'use server'

import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { toggleFavorite } from '@/lib/db/queries/favorites'
import type { ActionState } from '@/lib/action-state'

const target = z.object({ productId: z.coerce.number().int().positive() })

type FavoriteState = ActionState<{ favorited?: boolean; needsLogin?: boolean }>

export async function toggle(productId: number): Promise<FavoriteState> {
  const session = await getSession()
  if (!session) return { needsLogin: true }

  const parsed = target.safeParse({ productId })
  if (!parsed.success) return { error: 'That product could not be saved.' }

  return { favorited: await toggleFavorite(session.user.id, parsed.data.productId) }
}
