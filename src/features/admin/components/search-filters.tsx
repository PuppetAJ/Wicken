'use client'

import { useRouter } from 'next/navigation'
import { useRef, useTransition, type FormEvent } from 'react'
import { control } from '@/components/elements/control'
import { useDebouncedQuery } from '@/components/use-debounced-query'

const LIMIT = 100

export function SearchFilters({
  action,
  placeholder,
  defaults,
  selects = [],
  hidden = {},
}: {
  action: string
  placeholder: string
  defaults: { q?: string }
  selects?: { name: string; label: string; value?: string; options: { value: string; label: string }[] }[]
  hidden?: Record<string, string | undefined>
}) {
  const form = useRef<HTMLFormElement>(null)
  const [, start] = useTransition()
  const router = useRouter()

  const { value, setValue, pending } = useDebouncedQuery({
    applied: defaults.q ?? '',
    maxLength: LIMIT,
    build: (wanted) => {
      const search = new URLSearchParams()
      if (form.current) {
        for (const [key, entry] of new FormData(form.current).entries()) {
          if (key !== 'q' && typeof entry === 'string' && entry) search.set(key, entry)
        }
      }
      if (wanted) search.set('q', wanted)
      const query = search.toString()
      return query ? `${action}?${query}` : action
    },
  })

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = new URLSearchParams()
    for (const [key, entry] of new FormData(event.currentTarget).entries()) {
      if (typeof entry === 'string' && entry) search.set(key, entry)
    }
    const query = search.toString()
    start(() => router.replace(query ? `${action}?${query}` : action, { scroll: false }))
  }

  const field = `${control} px-3 py-1.5`

  return (
    <form ref={form} action={action} onSubmit={apply} className="flex flex-wrap items-center gap-3">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={LIMIT}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${field} w-56`}
      />
      {selects.map((select) => (
        <select
          key={select.name}
          name={select.name}
          defaultValue={select.value ?? ''}
          aria-label={select.label}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={`${field} pr-8`}
        >
          <option value="">{select.label}</option>
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      <span aria-live="polite" className="sr-only">
        {pending ? 'Filtering' : ''}
      </span>
      <noscript>
        <button
          type="submit"
          className="rounded-lg border border-olive-300 px-3 py-1.5 text-sm text-olive-700 dark:border-olive-800 dark:text-olive-300"
        >
          Filter
        </button>
      </noscript>
    </form>
  )
}
