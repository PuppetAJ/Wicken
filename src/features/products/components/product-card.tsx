import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product } from '@/lib/db/types'
import { Price, SaleBadge } from './price'
import { focalPosition } from '../focal'

const tile = 'relative aspect-square overflow-hidden rounded-xl bg-tile'

const gridSizes =
  '(min-width: 1280px) 240px, (min-width: 1024px) 18vw, (min-width: 640px) 350px, (min-width: 400px) 45vw, 92vw'

export const railSizes = '(min-width: 1280px) 290px, (min-width: 1024px) 22vw, (min-width: 640px) 330px, 48vw'

export function ProductCard({
  product,
  priority = false,
  eager = false,
  sizes = gridSizes,
  from = '',
  actions,
  rating,
}: {
  product: Product
  priority?: boolean
  eager?: boolean
  sizes?: string
  from?: string
  actions?: ReactNode
  rating?: ReactNode
}) {
  const soldOut = product.stock_quantity === 0

  return (
    // Not a Link wrapper: a button inside an anchor is invalid, so the title carries a stretched link.
    <article className="group relative flex flex-col gap-3">
      <div className={tile}>
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes={sizes}
            priority={priority}
            loading={!priority && eager ? 'eager' : undefined}
            style={{ objectPosition: focalPosition(product.slug) }}
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        {soldOut ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-olive-950">
            Sold out
          </span>
        ) : (
          <SaleBadge product={product} />
        )}
        {actions}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-olive-950 dark:text-white">
          <Link
            href={`/products/${product.slug}${from}`}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {product.name}
          </Link>
        </h3>
        <Price product={product} />
      </div>
      {rating}
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className={tile} />
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}
