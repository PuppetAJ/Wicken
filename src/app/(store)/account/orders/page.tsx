import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Heading } from '@/components/elements/heading'
import { Text } from '@/components/elements/text'
import { Skeleton } from '@/components/ui/skeleton'
import { requireUser } from '@/lib/auth/session'
import { listOrdersForUser } from '@/lib/db/queries/orders'
import { OrderStatus } from '@/components/elements/order-status'
import { ResumePayment } from '@/features/checkout/components/resume-payment'
import { formatDate, formatPrice } from '@/lib/format'
import { EmptyState } from '@/components/elements/empty-state'

export const metadata = { title: 'Your orders' }

export const instant = false

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Heading>Your orders</Heading>
        <Text>
          <p>Everything you have bought, newest first. Nothing here was really charged.</p>
        </Text>
      </div>
      <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
        <Orders />
      </Suspense>
    </div>
  )
}

async function Orders() {
  const user = await requireUser()
  const orders = await listOrdersForUser(user.id)

  if (orders.length === 0) {
    return (
      <EmptyState>
        Nothing ordered yet. When you buy something it will live here, with everything that was in it.
      </EmptyState>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => {
        const count = order.items.reduce((total, item) => total + item.quantity, 0)

        return (
          <li
            key={order.id}
            className="flex flex-col gap-4 rounded-xl border border-olive-950/10 p-5 dark:border-white/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-medium text-olive-950 dark:text-white">Order #{order.id}</span>
                <OrderStatus status={order.status} />
              </div>
              <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-olive-600 dark:text-olive-400">
                <div className="flex gap-2">
                  <dt>Placed</dt>
                  <dd className="text-olive-950 dark:text-white">{formatDate(order.created_at)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>Total</dt>
                  <dd className="text-olive-950 tabular-nums dark:text-white">{formatPrice(order.total_cents)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {order.items.slice(0, 5).map((item) => (
                <div
                  key={`${order.id}-${item.product_slug}`}
                  className="relative size-14 overflow-hidden rounded-lg bg-tile"
                  title={item.product_name}
                >
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.product_name} fill sizes="56px" className="object-cover" />
                  ) : null}
                </div>
              ))}
              {order.items.length > 5 ? (
                <span className="text-sm text-olive-600 dark:text-olive-400">+{order.items.length - 5} more</span>
              ) : null}
              <span className="ml-auto text-sm text-olive-600 dark:text-olive-400">
                {count} item{count === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={`/account/orders/${order.id}`}
                className="text-sm text-olive-950 underline underline-offset-4 hover:text-olive-700 dark:text-white dark:hover:text-olive-300"
              >
                View this order
              </Link>
              {order.status === 'pending' && <ResumePayment orderId={order.id} />}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
