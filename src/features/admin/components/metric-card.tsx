import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from 'lucide-react'

export function MetricCard({
  label,
  value,
  was,
  now,
  invert = false,
}: {
  label: string
  value: string
  was: number
  now: number
  invert?: boolean
}) {
  const change = was === 0 ? (now === 0 ? 0 : null) : ((now - was) / was) * 100
  const better = change === null ? true : invert ? change < 0 : change > 0
  const flat = change === 0

  const Icon = flat ? ArrowRightIcon : (change ?? 1) > 0 ? ArrowUpRightIcon : ArrowDownRightIcon
  const tone = flat
    ? 'text-olive-600 dark:text-olive-400'
    : better
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-red-700 dark:text-red-400'

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-olive-950/10 p-5 dark:border-white/10">
      <span className="text-sm text-olive-600 dark:text-olive-400">{label}</span>
      <span className="font-display text-2xl font-medium text-olive-950 tabular-nums dark:text-white">{value}</span>
      <span className={`flex items-center gap-1 text-xs ${tone}`}>
        <Icon className="size-3.5" aria-hidden />
        {change === null ? 'new this period' : `${Math.abs(change).toFixed(1)}% on the period before`}
      </span>
    </div>
  )
}
