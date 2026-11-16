import type { Category } from '@/lib/db/types'
import { formatMonthAndDay, formatPrice } from '@/lib/format'
import { leadTimeFor, slowestLeadTime } from '@/lib/lead-times'

function arrivalWindow(categories: Category[], from = new Date()) {
  const lead = categories.length ? slowestLeadTime(categories) : leadTimeFor('tableware')
  const add = (count: number) => {
    const date = new Date(from)
    if (lead.unit === 'weeks') {
      date.setDate(date.getDate() + count * 7)
      return date
    }
    let left = count
    while (left > 0) {
      date.setDate(date.getDate() + 1)
      if (date.getDay() !== 0 && date.getDay() !== 6) left--
    }
    return date
  }
  return `${formatMonthAndDay(add(lead.least))} – ${formatMonthAndDay(add(lead.most))}`
}

export function OrderBreakdown({ subtotal, categories = [] }: { subtotal: number; categories?: Category[] }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex justify-between text-olive-600 dark:text-olive-400">
        <span>Subtotal</span>
        <span className="text-olive-950 tabular-nums dark:text-white">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-olive-600 dark:text-olive-400">
        <span>Shipping</span>
        <span className="text-olive-950 dark:text-white">Free</span>
      </div>
      <div className="flex justify-between border-t border-olive-950/10 pt-3 text-base font-medium text-olive-950 dark:border-white/10 dark:text-white">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(subtotal)}</span>
      </div>
      <p className="text-xs text-olive-600 dark:text-olive-400">
        Arrives {arrivalWindow(categories)}, packed in molded paper instead of plastic.
      </p>
    </div>
  )
}
