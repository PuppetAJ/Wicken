import Image from 'next/image'
import Link from 'next/link'
import type { OrderItem } from '@/lib/db/types'
import { formatPrice } from '@/lib/format'

export type Line = {
  name: string
  slug?: string | null
  image_url: string | null
  quantity: number
  unit_price_cents: number
}

const thumbnails = {
  sm: { className: 'size-14', sizes: '56px' },
  md: { className: 'size-16', sizes: '64px' },
  lg: { className: 'size-20', sizes: '80px' },
}

export function OrderLines({
  items,
  size = 'md',
  total,
}: {
  items: Line[]
  size?: keyof typeof thumbnails
  total?: number
}) {
  const thumbnail = thumbnails[size]

  return (
    <ul className="divide-y divide-olive-950/10 dark:divide-white/10">
      {items.map((item) => (
        <li key={`${item.slug}-${item.name}`} className="flex gap-4 py-4">
          <div className={`relative shrink-0 overflow-hidden rounded-lg bg-tile ${thumbnail.className}`}>
            {item.image_url ? (
              <Image src={item.image_url} alt="" fill sizes={thumbnail.sizes} className="object-cover" />
            ) : null}
          </div>
          <div className="flex flex-1 items-start justify-between gap-4">
            <div>
              {item.slug ? (
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-medium text-olive-950 hover:underline dark:text-white"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-olive-950 dark:text-white">{item.name}</span>
              )}
              <p className="text-sm text-olive-600 dark:text-olive-400">Quantity {item.quantity}</p>
            </div>
            <p className="text-sm text-olive-950 tabular-nums dark:text-white">
              {formatPrice(item.unit_price_cents * item.quantity)}
            </p>
          </div>
        </li>
      ))}
      {total !== undefined && (
        <li className="flex justify-between py-4 font-medium text-olive-950 dark:text-white">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </li>
      )}
    </ul>
  )
}

export function linesOf(items: OrderItem[]): Line[] {
  return items.map((item) => ({
    name: item.product_name,
    slug: item.product_id ? item.product_slug : null,
    image_url: item.image_url,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents,
  }))
}
