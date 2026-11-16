import Link from 'next/link'
import { Suspense } from 'react'
import { OrderStatus } from '@/components/elements/order-status'
import { Cell, IndexTable, IndexTableSkeleton } from '@/features/admin/components/index-table'
import { LinkRow } from '@/features/admin/components/link-row'
import { Pagination } from '@/features/admin/components/pagination'
import { SearchFilters } from '@/features/admin/components/search-filters'
import { adminListSearch, pageHref, sortHref } from '@/features/admin/schemas'
import { requireAdmin } from '@/lib/auth/session'
import { listAdminOrders, orderSortDefaults, orderSorts, type OrderSort } from '@/lib/db/queries/admin'
import { perPage } from '@/lib/db/queries/paging'
import { orderStatuses } from '@/lib/db/types'
import { formatDate, formatPrice } from '@/lib/format'
import { z } from 'zod'
import { AdminHeading } from '@/features/admin/components/admin-heading'

export const metadata = { title: 'Orders · Admin' }

export const instant = false

const search = adminListSearch.extend({
  status: z.enum(orderStatuses).optional().catch(undefined),
  sort: z.enum(orderSorts).default('placed').catch('placed'),
  dir: z.enum(['asc', 'desc']).optional().catch(undefined),
})

const columns: { key: OrderSort; label: string }[] = [
  { key: 'order', label: 'Order' },
  { key: 'placed', label: 'Placed' },
  { key: 'status', label: 'Status' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
]

export default async function Page({ searchParams }: PageProps<'/admin/orders'>) {
  await requireAdmin()
  const filters = search.parse(await searchParams)

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading>Orders</AdminHeading>
      <SearchFilters
        action="/admin/orders"
        placeholder="Customer name or email"
        defaults={{ q: filters.q }}
        hidden={{ sort: filters.sort, dir: filters.dir }}
        selects={[
          {
            name: 'status',
            label: 'Any status',
            value: filters.status,
            options: orderStatuses.map((status) => ({ value: status, label: status })),
          },
        ]}
      />
      <Suspense key={JSON.stringify(filters)} fallback={<IndexTableSkeleton />}>
        <Rows filters={filters} />
      </Suspense>
    </div>
  )
}

async function Rows({ filters }: { filters: z.infer<typeof search> }) {
  const { rows: orders, total } = await listAdminOrders(filters)
  const active = { sort: filters.sort, dir: filters.dir ?? orderSortDefaults[filters.sort] }
  const kept = { q: filters.q, status: filters.status }

  return (
    <>
      <IndexTable
        columns={columns.map(({ key, label }) => ({
          label,
          href: sortHref('/admin/orders', kept, key, active, orderSortDefaults),
          sorted: key === active.sort ? active.dir : undefined,
        }))}
        empty="No orders match that."
      >
        {orders.map((order) => (
          <LinkRow key={order.id} href={`/admin/orders/${order.id}`}>
            <Cell>
              <span className="block text-xs text-olive-600 dark:text-olive-400">{order.customer_name}</span>
              <Link
                href={`/admin/orders/${order.id}`}
                className="font-medium text-olive-950 hover:underline dark:text-white"
              >
                Order #{order.id}
              </Link>
            </Cell>
            <Cell className="whitespace-nowrap text-olive-600 dark:text-olive-400">{formatDate(order.created_at)}</Cell>
            <Cell>
              <OrderStatus status={order.status} />
            </Cell>
            <Cell className="text-olive-600 tabular-nums dark:text-olive-400">
              {order.items.reduce((count, item) => count + item.quantity, 0)}
            </Cell>
            <Cell align="right" className="font-medium text-olive-950 tabular-nums dark:text-white">
              {formatPrice(order.total_cents)}
            </Cell>
          </LinkRow>
        ))}
      </IndexTable>
      <Pagination
        page={filters.page}
        total={total}
        perPage={perPage}
        href={(page) => pageHref('/admin/orders', { ...kept, sort: filters.sort, dir: filters.dir }, page)}
      />
    </>
  )
}
