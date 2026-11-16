'use client'

import { HeartIcon, ShoppingBagIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Pop } from '@/components/motion'
import { quickAdd } from '@/features/cart/actions'
import { useFavorite } from '@/features/favorites/use-favorite'

const shell =
  'pointer-events-none absolute inset-0 z-10 hidden items-center justify-center gap-3 transition-opacity pointer-fine:flex ' +
  'pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 ' +
  'motion-reduce:transition-none'

const button =
  'pointer-events-auto inline-flex size-11 items-center justify-center rounded-full bg-white/95 text-olive-950 shadow-sm ' +
  'transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ' +
  'disabled:opacity-60 dark:bg-olive-950/90 dark:text-white dark:hover:bg-olive-950'

export function QuickActions({
  productId,
  name,
  soldOut,
  favorited,
}: {
  productId: number
  name: string
  soldOut: boolean
  favorited: boolean
}) {
  const { isFavorite, pending: saving, save, label } = useFavorite(productId, name, favorited)
  const [adding, start] = useTransition()
  const router = useRouter()
  const pending = saving || adding

  function add() {
    start(async () => {
      const result = await quickAdd(productId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(`${name} added to your cart`)
      router.refresh()
    })
  }

  return (
    <div className={shell}>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        aria-pressed={isFavorite}
        aria-label={label}
        className={button}
      >
        <Pop on={isFavorite} className="inline-flex">
          <HeartIcon className={isFavorite ? 'size-5 fill-current' : 'size-5'} />
        </Pop>
      </button>
      {!soldOut && (
        <button
          type="button"
          onClick={add}
          disabled={pending}
          aria-label={`Add ${name} to your cart`}
          className={button}
        >
          <ShoppingBagIcon className="size-5" />
        </button>
      )}
    </div>
  )
}
