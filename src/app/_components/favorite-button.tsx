'use client'

import { HeartIcon } from 'lucide-react'
import { Pop } from '@/components/motion'
import { useFavorite } from '@/features/favorites/use-favorite'

export function FavoriteButton({
  productId,
  name,
  favorited,
}: {
  productId: number
  name: string
  favorited: boolean
}) {
  const { isFavorite, pending, save, label } = useFavorite(productId, name, favorited)

  return (
    <button
      type="button"
      onClick={save}
      disabled={pending}
      aria-pressed={isFavorite}
      data-favorite="product"
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-olive-950/15 text-olive-700 transition-colors hover:bg-olive-950/5 disabled:opacity-60 dark:border-white/20 dark:text-olive-300 dark:hover:bg-white/10"
    >
      <Pop on={isFavorite} className="inline-flex">
        <HeartIcon className={isFavorite ? 'size-5 fill-current' : 'size-5'} />
      </Pop>
    </button>
  )
}
