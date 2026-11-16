import type { Funnel as Steps } from '@/lib/db/queries/events'
import { formatCount } from '@/lib/format'

export function Funnel({ steps }: { steps: Steps }) {
  const rows = [
    ['Visited', steps.sessions],
    ['Opened a product', steps.product_views],
    ['Added to a cart', steps.carts],
    ['Reached checkout', steps.checkouts],
    ['Bought something', steps.purchases],
  ] as const
  const widest = Math.max(steps.sessions, 1)

  return (
    <ol className="flex flex-col gap-3">
      {rows.map(([label, count], step) => {
        const share = (count / widest) * 100
        const kept = step === 0 ? null : (count / Math.max(rows[step - 1][1], 1)) * 100

        return (
          <li key={label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-olive-700 dark:text-olive-300">{label}</span>
              <span className="text-olive-950 tabular-nums dark:text-white">
                {formatCount(count)}
                {kept !== null && (
                  <span className="text-xs text-olive-600 dark:text-olive-400">
                    {' · '}
                    {kept.toFixed(0)}% of above
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-olive-950/5 dark:bg-white/5">
              <div
                className="h-full rounded-full bg-(--chart-1)"
                style={{ width: `${Math.max(share, 1)}%`, opacity: 1 - step * 0.13 }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
