import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { SortSelect } from '@/components/elements/sort-select'
import { Skeleton } from '@/components/ui/skeleton'
import { CategorySplitChart } from '@/features/admin/components/category-split'
import { Funnel } from '@/features/admin/components/funnel'
import { MetricCard } from '@/features/admin/components/metric-card'
import { TrendChart } from '@/features/admin/components/trend-chart'
import { adminHref, adminSearchSchema, rangeLabels, ranges, windows } from '@/features/admin/schemas'
import { categoryLabels } from '@/features/products/schemas'
import { requireAdmin } from '@/lib/auth/session'
import { lowStock, revenueByDay, salesByCategory, topSellers, totalsBetween } from '@/lib/db/queries/dashboard'
import { funnelBetween, sessionsByDay, visitorsBetween } from '@/lib/db/queries/events'
import { formatCount, formatUtcDay, formatPrice } from '@/lib/format'
import { AdminHeading } from '@/features/admin/components/admin-heading'

export const metadata = { title: 'Admin' }

export const instant = false

export default async function Page({ searchParams }: PageProps<'/admin'>) {
  await requireAdmin()
  const { range } = adminSearchSchema.parse(await searchParams)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminHeading>Overview</AdminHeading>
        <SortSelect
          label="Period"
          value={range}
          options={ranges.map((value) => ({
            value,
            label: rangeLabels[value],
            href: adminHref('/admin', { range: value === '30' ? undefined : value }),
          }))}
        />
      </div>

      <Suspense key={range} fallback={<OverviewSkeleton />}>
        <Figures range={range} />
      </Suspense>
    </div>
  )
}

async function Figures({ range }: { range: '7' | '30' | '90' }) {
  const { from, to, wasFrom, wasTo } = windows(range)
  const [now, before, revenue, sessions, funnel, wasFunnel, sellers, low, split, visitors] = await Promise.all([
    totalsBetween(from, to),
    totalsBetween(wasFrom, wasTo),
    revenueByDay(from, to),
    sessionsByDay(from, to),
    funnelBetween(from, to),
    funnelBetween(wasFrom, wasTo),
    topSellers(from, to),
    lowStock(),
    salesByCategory(from, to),
    visitorsBetween(from, to),
  ])

  const since = formatUtcDay(from)
  const conversion = funnel.sessions > 0 ? (funnel.purchases / funnel.sessions) * 100 : 0
  const wasConversion = wasFunnel.sessions > 0 ? (wasFunnel.purchases / wasFunnel.sessions) * 100 : 0

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross sales"
          value={formatPrice(now.revenue_cents)}
          was={before.revenue_cents}
          now={now.revenue_cents}
        />
        <MetricCard label="Orders" value={String(now.orders)} was={before.orders} now={now.orders} />
        <MetricCard
          label="Average order"
          value={formatPrice(now.average_cents)}
          was={before.average_cents}
          now={now.average_cents}
        />
        <MetricCard label="Conversion" value={`${conversion.toFixed(2)}%`} was={wasConversion} now={conversion} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue" note="Paid orders only.">
          <TrendChart data={revenue} dataKey="revenue_cents" label="Revenue" money />
        </Panel>
        <Panel title="Sessions" note="A session is one tab, counted once.">
          <TrendChart data={sessions} dataKey="sessions" label="Sessions" />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="What sells" note="Share of revenue by category.">
          <CategorySplitChart
            split={split.map((row) => ({ label: categoryLabels[row.category], revenue_cents: row.revenue_cents }))}
          />
        </Panel>

        <Panel title="How far people get" note="Sessions reaching each step.">
          <Funnel steps={funnel} />
        </Panel>
      </div>

      <Panel
        title="Signed-in shoppers"
        note="People with an account. Anonymous visits are counted under Sessions and cannot appear here."
      >
        {visitors.signedIn === 0 ? (
          <Empty>No signed-in shopper looked at anything in this period.</Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {[
              {
                count: visitors.signedIn,
                of: null,
                says: `accounts signed in and looked at something since ${since}`,
              },
              {
                count: visitors.returning,
                of: visitors.signedIn,
                says: `had also visited before ${since}`,
              },
              {
                count: visitors.bought,
                of: visitors.signedIn,
                says: `bought something since ${since}`,
              },
            ].map(({ count, of, says }) => (
              <li key={says} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-display text-xl font-medium text-olive-950 tabular-nums dark:text-white">
                  {formatCount(count)}
                  {of !== null && (
                    <span className="text-base font-normal text-olive-600 dark:text-olive-400">
                      {' of '}
                      {formatCount(of)}
                    </span>
                  )}
                </span>
                <span className="text-sm text-olive-700 dark:text-olive-300">{says}</span>
                {of !== null && (
                  <span className="text-sm text-olive-600 tabular-nums dark:text-olive-400">
                    ({((count / of) * 100).toFixed(0)}%)
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Best sellers">
          {sellers.length === 0 ? (
            <Empty>Nothing sold in this period.</Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {sellers.map((seller) => (
                <li key={seller.id} className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-tile">
                    {seller.image_url ? (
                      <Image src={seller.image_url} alt="" fill sizes="40px" className="object-cover" />
                    ) : null}
                  </div>
                  <Link
                    href={`/products/${seller.slug}`}
                    className="min-w-0 flex-1 truncate text-sm text-olive-950 hover:underline dark:text-white"
                  >
                    {seller.name}
                  </Link>
                  <span className="shrink-0 text-sm text-olive-600 tabular-nums dark:text-olive-400">
                    {seller.sold} · {formatPrice(seller.revenue_cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Running low" note="Three left or fewer.">
          {low.length === 0 ? (
            <Empty>Everything is well stocked.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {low.map((product) => (
                <li key={product.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="truncate text-olive-950 hover:underline dark:text-white"
                  >
                    {product.name}
                  </Link>
                  <span
                    className={`shrink-0 tabular-nums ${
                      product.stock_quantity === 0
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-olive-600 dark:text-olive-400'
                    }`}
                  >
                    {product.stock_quantity === 0 ? 'Sold out' : `${product.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

// min-w-0, or a grid item refuses to shrink below its content and widens the whole page.
function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-olive-950/10 p-5 dark:border-white/10">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-medium text-olive-950 dark:text-white">{title}</h2>
        {note && <p className="text-xs text-olive-600 dark:text-olive-400">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-olive-600 dark:text-olive-400">{children}</p>
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <Skeleton key={card} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
