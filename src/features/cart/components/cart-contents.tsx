import { getCart } from '../cart'
import { CartLines } from './cart-lines'
import { CartLink } from './cart-link'

export async function CartContents() {
  const items = await getCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-olive-600 dark:text-olive-400">Nothing in here yet.</p>
        <CartLink
          href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-olive-950 px-4 py-2 text-sm/7 font-medium text-white hover:bg-olive-800 dark:bg-olive-300 dark:text-olive-950 dark:hover:bg-olive-200"
        >
          Browse the collection
        </CartLink>
      </div>
    )
  }

  return (
    <>
      <CartLines items={items} />
      <div className="grid gap-3 px-4 pb-6">
        <CartLink
          href="/checkout"
          className="inline-flex items-center justify-center rounded-full bg-olive-950 px-4 py-2 text-sm/7 font-medium text-white hover:bg-olive-800 dark:bg-olive-300 dark:text-olive-950 dark:hover:bg-olive-200"
        >
          Checkout
        </CartLink>
        <CartLink
          href="/cart"
          className="text-center text-sm text-olive-600 underline underline-offset-4 dark:text-olive-400"
        >
          View the full cart
        </CartLink>
      </div>
    </>
  )
}

export function CartContentsSkeleton() {
  return <div className="flex-1 px-4 py-6 text-sm text-olive-600 dark:text-olive-400">Loading your cart…</div>
}
