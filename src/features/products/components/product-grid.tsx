import type { ReactNode } from 'react'
import { Stagger } from '@/components/motion'
import type { Product } from '@/lib/db/types'
import { ProductCard, ProductCardSkeleton } from './product-card'

const grid = 'grid grid-cols-1 gap-x-6 gap-y-10 min-[400px]:grid-cols-2 lg:grid-cols-4'

export function ProductGrid({
  products,
  from,
  actions,
  rating,
}: {
  products: Product[]
  from?: string
  actions?: (product: Product) => ReactNode
  rating?: (product: Product) => ReactNode
}) {
  return (
    <Stagger className={grid}>
      {products.map((product, i) => (
        // Only the first row is preloaded; preloading eager tiles left the optimizer holding some responses open.
        <ProductCard
          key={product.id}
          product={product}
          priority={i < 4}
          from={from}
          actions={actions?.(product)}
          rating={rating?.(product)}
        />
      ))}
    </Stagger>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={grid}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
