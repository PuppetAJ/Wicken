import type { Product } from '@/lib/db/types'
import { formatPrice } from '@/lib/format'

export function Price({ product, size = 'sm' }: { product: Product; size?: 'sm' | 'lg' }) {
  const onSale = product.sale_price_cents !== null
  const big = size === 'lg'

  if (!onSale) {
    return (
      <span className={big ? 'text-2xl text-olive-950 dark:text-white' : 'text-sm text-olive-600 dark:text-olive-400'}>
        {formatPrice(product.price_cents)}
      </span>
    )
  }

  return (
    <span className={`flex items-baseline gap-2 ${big ? 'text-2xl' : 'text-sm'}`}>
      <span className="text-olive-950 dark:text-white">{formatPrice(product.sale_price_cents!)}</span>
      <s className={`text-olive-600 dark:text-olive-400 ${big ? 'text-lg' : 'text-xs'}`}>
        {formatPrice(product.price_cents)}
      </s>
    </span>
  )
}

export function SaleBadge({ product }: { product: Product }) {
  if (product.sale_price_cents === null) return null
  const off = Math.round((1 - product.sale_price_cents / product.price_cents) * 100)

  return (
    <span className="absolute top-3 left-3 rounded-full bg-olive-950 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-olive-950">
      {off}% off
    </span>
  )
}
