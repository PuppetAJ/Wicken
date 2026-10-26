import { getCartCount } from '../cart'

export async function CartBadge() {
  const count = await getCartCount()
  if (count === 0) return null

  return (
    <>
      <span
        data-cart-badge
        className="absolute -top-0.5 -right-0.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-olive-950 px-1 text-[10px]/4.5 font-medium text-white tabular-nums dark:bg-olive-300 dark:text-olive-950"
      >
        {count > 99 ? '99+' : count}
      </span>
      <span className="sr-only"> {count === 1 ? 'item' : 'items'}</span>
    </>
  )
}
