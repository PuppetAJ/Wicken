'use client'

import { Cell, Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatPrice } from '@/lib/format'

const slots = ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function CategorySplitChart({ split }: { split: { label: string; revenue_cents: number }[] }) {
  const total = split.reduce((sum, row) => sum + row.revenue_cents, 0)
  const data = split.map((row, index) => ({
    name: row.label,
    value: row.revenue_cents,
    fill: slots[index % slots.length],
  }))

  const config: ChartConfig = Object.fromEntries(
    data.map((row, index) => [row.name, { label: row.name, color: slots[index % slots.length] }]),
  )

  if (total === 0) return <p className="text-sm text-olive-600 dark:text-olive-400">Nothing sold in this period.</p>

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChartContainer config={config} className="aspect-square h-48 shrink-0">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent hideLabel formatter={(value, name) => `${name}: ${formatPrice(Number(value))}`} />
            }
          />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} strokeWidth={2}>
            {data.map((row) => (
              <Cell key={row.name} fill={row.fill} stroke="var(--color-background)" />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && 'cx' in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-olive-950 text-lg font-medium dark:fill-white">
                      {formatPrice(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 18}
                      className="fill-olive-600 text-xs dark:fill-olive-400"
                    >
                      in all
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="flex flex-1 flex-col gap-2">
        {data.map((row) => (
          <li key={row.name} className="flex items-center gap-2.5 text-sm">
            <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: row.fill }} />
            <span className="flex-1 text-olive-700 dark:text-olive-300">{row.name}</span>
            <span className="shrink-0 text-olive-950 tabular-nums dark:text-white">{formatPrice(row.value)}</span>
            <span className="w-9 shrink-0 text-right text-xs text-olive-600 tabular-nums dark:text-olive-400">
              {((row.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
