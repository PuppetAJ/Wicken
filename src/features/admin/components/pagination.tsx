import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { formatCount } from '@/lib/format'

export function Pagination({
  page,
  total,
  perPage,
  href,
}: {
  page: number
  total: number
  perPage: number
  href: (page: number) => string
}) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  const first = total === 0 ? 0 : (page - 1) * perPage + 1
  const last = Math.min(page * perPage, total)

  const step =
    'inline-flex items-center gap-1 rounded-lg border border-olive-950/15 px-2.5 py-1.5 text-sm text-olive-700 hover:border-olive-950/30 hover:text-olive-950 dark:border-white/15 dark:text-olive-300 dark:hover:border-white/30 dark:hover:text-white'
  const off = 'pointer-events-none opacity-40'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-olive-600 dark:text-olive-400">
        {total === 0 ? 'Nothing to show' : `${first}–${last} of ${formatCount(total)}`}
      </p>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-2">
          <Link
            href={href(page - 1)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={`${step} ${page <= 1 ? off : ''}`}
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
            Previous
          </Link>
          <span className="text-sm text-olive-600 tabular-nums dark:text-olive-400">
            Page {page} of {pages}
          </span>
          <Link
            href={href(page + 1)}
            aria-disabled={page >= pages}
            tabIndex={page >= pages ? -1 : undefined}
            className={`${step} ${page >= pages ? off : ''}`}
          >
            Next
            <ChevronRightIcon className="size-4" aria-hidden />
          </Link>
        </nav>
      )}
    </div>
  )
}
