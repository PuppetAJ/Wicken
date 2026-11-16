'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import type { CartItem } from '@/lib/db/types'
import { formatPrice } from '@/lib/format'
import { removeFromCart, setQuantity } from '../actions'
import { useCartOpen } from './cart-open'
import { QuantityStepper } from './quantity-stepper'

type Change = { productId: number; quantity: number }

export function CartLines({ items }: { items: CartItem[] }) {
  const { setOpen } = useCartOpen()
  const [optimistic, apply] = useOptimistic(items, (state, change: Change) =>
    state
      .map((item) => (item.product_id === change.productId ? { ...item, quantity: change.quantity } : item))
      .filter((item) => item.quantity > 0),
  )
  const [pending, start] = useTransition()
  const router = useRouter()

  function change(productId: number, quantity: number) {
    start(async () => {
      apply({ productId, quantity })
      const result = quantity <= 0 ? await removeFromCart(productId) : await setQuantity(productId, quantity)
      if (result?.error) toast.error(result.error)
      router.refresh()
    })
  }

  const subtotal = optimistic.reduce((total, item) => total + item.unit_price_cents * item.quantity, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="flex-1 divide-y divide-olive-950/10 overflow-y-auto px-4 dark:divide-white/10">
        {optimistic.map((item) => (
          <li key={item.product_id} className="flex gap-3 py-4 sm:gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-tile sm:size-20">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="(min-width: 640px) 80px, 64px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                <Link
                  href={`/products/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-olive-950 hover:underline dark:text-white"
                >
                  {item.name}
                </Link>
                <span className="text-sm text-olive-950 tabular-nums dark:text-white">
                  {formatPrice(item.unit_price_cents * item.quantity)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <QuantityStepper
                  quantity={item.quantity}
                  max={item.stock_quantity}
                  min={0}
                  onChange={(quantity) => change(item.product_id, quantity)}
                  disabled={pending}
                  label={item.name}
                />
                <button
                  type="button"
                  onClick={() => change(item.product_id, 0)}
                  disabled={pending}
                  className="hidden text-sm text-olive-600 underline underline-offset-4 hover:text-olive-950 disabled:opacity-40 min-[380px]:inline dark:text-olive-400 dark:hover:text-white"
                >
                  Remove
                </button>
              </div>
              {item.quantity >= item.stock_quantity ? (
                <p className="text-xs text-olive-600 dark:text-olive-400">All {item.stock_quantity} we have.</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-olive-950/10 px-4 py-4 dark:border-white/10">
        <div className="flex justify-between text-sm font-medium text-olive-950 dark:text-white">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-olive-600 dark:text-olive-400">Shipping is worked out at checkout.</p>
      </div>
    </div>
  )
}
