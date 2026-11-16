'use client'

import { useRouter } from 'next/navigation'
import { useId, useTransition } from 'react'
import { control } from './control'

export function SortSelect({
  value,
  options,
  label = 'Sort',
  scroll = true,
}: {
  value: string
  options: { value: string; label: string; href: string }[]
  label?: string
  scroll?: boolean
}) {
  const router = useRouter()
  const id = useId()
  const [, start] = useTransition()
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor={id} className="sr-only text-sm text-olive-600 sm:not-sr-only dark:text-olive-400">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value)
          if (!next) return
          start(() => router.push(scroll ? next.href : next.href.split('#')[0], { scroll }))
        }}
        className={`${control} min-w-0 py-1.5 pr-8 pl-3`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
