import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { Scroller } from '@/components/elements/scroller'
import { perPage } from '@/lib/db/queries/paging'
import { Skeleton } from '@/components/ui/skeleton'

export type Column = string | { label: string; href: string; sorted?: 'asc' | 'desc' }

const labelOf = (column: Column) => (typeof column === 'string' ? column : column.label)

export function IndexTable({
  columns,
  children,
  empty,
}: {
  columns: Column[]
  children: ReactNode
  empty?: ReactNode
}) {
  const rows = Array.isArray(children) ? children.flat() : [children]
  if (rows.filter(Boolean).length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-olive-300 px-5 py-10 text-sm text-olive-600 dark:border-olive-800 dark:text-olive-400">
        {empty ?? 'Nothing here.'}
      </p>
    )
  }

  return (
    <Scroller className="rounded-xl border border-olive-950/10 dark:border-white/10">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-olive-950/10 dark:border-white/10">
            {columns.map((column, index) => {
              const last = index === columns.length - 1
              const sorted = typeof column === 'string' ? undefined : column.sorted
              return (
                <th
                  key={labelOf(column)}
                  scope="col"
                  aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                  className={`px-4 py-3 font-medium text-olive-600 dark:text-olive-400 ${last ? 'text-right' : 'text-left'}`}
                >
                  {typeof column === 'string' ? (
                    column
                  ) : (
                    <Link
                      href={column.href}
                      className={`group inline-flex items-center gap-1 hover:text-olive-950 dark:hover:text-white ${last ? 'flex-row-reverse' : ''}`}
                    >
                      {column.label}
                      {sorted === 'asc' ? (
                        <ArrowUpIcon className="size-3.5" aria-hidden />
                      ) : sorted === 'desc' ? (
                        <ArrowDownIcon className="size-3.5" aria-hidden />
                      ) : (
                        <ArrowUpDownIcon className="size-3.5 opacity-40 group-hover:opacity-100" aria-hidden />
                      )}
                    </Link>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-olive-950/10 dark:divide-white/10">{children}</tbody>
      </table>
    </Scroller>
  )
}

export { Cell, Row } from './table-row'

export function IndexTableSkeleton({ rows = perPage }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-olive-950/10 dark:border-white/10">
      <div className="border-b border-olive-950/10 px-4 py-3 dark:border-white/10">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-olive-950/10 dark:divide-white/10">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
