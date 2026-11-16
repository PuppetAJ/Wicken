import { Suspense } from 'react'
import { Cell, IndexTable, IndexTableSkeleton, Row } from '@/features/admin/components/index-table'
import { Pagination } from '@/features/admin/components/pagination'
import { SearchFilters } from '@/features/admin/components/search-filters'
import { adminListSearch, pageHref } from '@/features/admin/schemas'
import { requireAdmin } from '@/lib/auth/session'
import { listCustomers } from '@/lib/db/queries/admin'
import { perPage } from '@/lib/db/queries/paging'
import { countSubscribers } from '@/lib/db/queries/subscribers'
import { formatDate, formatPrice } from '@/lib/format'
import { AdminHeading } from '@/features/admin/components/admin-heading'

export const metadata = { title: 'Customers · Admin' }

export const instant = false

const search = adminListSearch

export default async function Page({ searchParams }: PageProps<'/admin/customers'>) {
  await requireAdmin()
  const filters = search.parse(await searchParams)
  const subscribers = await countSubscribers()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <AdminHeading>Customers</AdminHeading>
        <p className="text-sm text-olive-600 dark:text-olive-400">
          Read-only. Accounts cannot be edited or removed from here. {subscribers} on the newsletter list.
        </p>
      </div>
      <SearchFilters action="/admin/customers" placeholder="Name or email" defaults={{ q: filters.q }} />
      <Suspense key={JSON.stringify(filters)} fallback={<IndexTableSkeleton />}>
        <Rows q={filters.q} page={filters.page} />
      </Suspense>
    </div>
  )
}

async function Rows({ q, page }: { q?: string; page: number }) {
  const { rows: customers, total } = await listCustomers(q, page)

  return (
    <>
      <IndexTable columns={['Customer', 'Joined', 'Orders', 'Last order', 'Spent']} empty="Nobody matches that.">
        {customers.map((customer) => (
          <Row key={customer.id}>
            <Cell>
              <span className="block text-xs text-olive-600 dark:text-olive-400">{customer.email}</span>
              <span className="font-medium text-olive-950 dark:text-white">{customer.name}</span>
            </Cell>
            <Cell className="whitespace-nowrap text-olive-600 dark:text-olive-400">
              {formatDate(customer.created_at)}
            </Cell>
            <Cell className="text-olive-600 tabular-nums dark:text-olive-400">{customer.orders}</Cell>
            <Cell className="whitespace-nowrap text-olive-600 dark:text-olive-400">
              {customer.last_order ? formatDate(customer.last_order) : 'Never'}
            </Cell>
            <Cell align="right" className="font-medium text-olive-950 tabular-nums dark:text-white">
              {formatPrice(customer.spent_cents)}
            </Cell>
          </Row>
        ))}
      </IndexTable>
      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        href={(next) => pageHref('/admin/customers', { q }, next)}
      />
    </>
  )
}
