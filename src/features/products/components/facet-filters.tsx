'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition, type FormEvent, type ReactNode } from 'react'
import { clsx } from 'clsx/lite'
import { categories } from '@/lib/db/types'
import {
  categoryLabels,
  colorLabels,
  colorSwatches,
  materialLabels,
  priceBandLabels,
  priceBands,
  shopHref,
  type ShopSearch,
} from '../schemas'
import type { colors, materials } from '../schemas'

type Material = (typeof materials)[number]
type Color = (typeof colors)[number]

// Drawn, not native: accent-color reaches only the checked fill, never the unchecked box.
const box =
  'flex size-4 shrink-0 items-center justify-center border text-transparent transition-colors ' +
  'border-olive-400 bg-white dark:border-white/20 dark:bg-white/[0.06] ' +
  'peer-checked:border-olive-950 peer-checked:bg-olive-950 peer-checked:text-white ' +
  'dark:peer-checked:border-olive-200 dark:peer-checked:bg-olive-200 dark:peer-checked:text-olive-950 ' +
  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ' +
  'peer-focus-visible:ring-offset-background motion-reduce:transition-none'

const row = 'flex cursor-pointer items-center gap-2.5 text-sm'
const label = 'text-olive-700 dark:text-olive-300'

function Checkmark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className="size-3">
      <path d="M2.5 6.2 4.7 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Check({
  name,
  value,
  children,
  round = false,
  checked,
  onToggle,
}: {
  name: string
  value: string
  children: ReactNode
  round?: boolean
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className={row}>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        onChange={onToggle}
        className="peer sr-only"
      />
      <span className={`${box} ${round ? 'rounded-full' : 'rounded-sm'}`}>
        <Checkmark />
      </span>
      <span className={label}>{children}</span>
    </label>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-olive-950 dark:text-white">{label}</h2>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{label}</legend>
        {children}
      </fieldset>
    </div>
  )
}

export function FacetFilters({
  search,
  facets,
  withCategories = false,
}: {
  search: ShopSearch
  facets: { materials: string[]; colors: string[] }
  withCategories?: boolean
}) {
  const form = useRef<HTMLFormElement>(null)
  const [, start] = useTransition()
  const router = useRouter()
  const submit = () => form.current?.requestSubmit()

  // A touched box stops following its attribute, so "Clear all" would leave it ticked with nothing set.
  const applied = shopHref(search)
  useEffect(() => {
    for (const node of form.current?.querySelectorAll('input[type=checkbox],input[type=radio]') ?? []) {
      const input = node as HTMLInputElement
      input.checked = input.defaultChecked
    }
  }, [applied])

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === 'string' && value) params.append(key, value)
    }
    const query = params.toString()
    start(() => router.replace(query ? `/shop?${query}` : '/shop', { scroll: false }))
  }

  return (
    <form ref={form} action="/shop" onSubmit={apply} className="flex flex-col gap-8">
      {search.category && !withCategories && <input type="hidden" name="category" value={search.category} />}
      {search.sort !== 'newest' && <input type="hidden" name="sort" value={search.sort} />}
      {search.q && <input type="hidden" name="q" value={search.q} />}

      {withCategories && (
        <Group label="Category">
          <div className="flex flex-wrap gap-2">
            <Chip name="" label="Everything" checked={!search.category} onPick={submit} />
            {categories.map((category) => (
              <Chip
                key={category}
                name={category}
                label={categoryLabels[category]}
                checked={search.category === category}
                onPick={submit}
              />
            ))}
          </div>
        </Group>
      )}

      <Group label="Price">
        {priceBands.map((band) => (
          <Check
            key={band}
            name="price"
            value={band}
            round
            checked={search.price?.includes(band) ?? false}
            onToggle={submit}
          >
            {priceBandLabels[band]}
          </Check>
        ))}
      </Group>

      <Group label="Material">
        {facets.materials.map((value) => {
          const material = value as Material
          return (
            <Check
              key={value}
              name="material"
              value={material}
              checked={search.material?.includes(material) ?? false}
              onToggle={submit}
            >
              {materialLabels[material]}
            </Check>
          )
        })}
      </Group>

      <Group label="Color">
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((value) => {
            const color = value as Color
            const on = search.color?.includes(color) ?? false
            const swatch = colorSwatches[color]
            return (
              <label key={value} title={colorLabels[color]} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="color"
                  value={color}
                  defaultChecked={on}
                  onChange={submit}
                  className="peer sr-only"
                />
                <span className="sr-only">{colorLabels[color]}</span>
                <span
                  aria-hidden
                  style={swatch.startsWith('conic') ? { backgroundImage: swatch } : { backgroundColor: swatch }}
                  className={`block size-7 rounded-full border bg-origin-border transition-[box-shadow,border-color] peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${
                    on
                      ? 'border-olive-950 ring-2 ring-olive-950 ring-offset-2 dark:border-white dark:ring-white'
                      : 'border-olive-950/20 dark:border-white/25'
                  }`}
                />
              </label>
            )
          })}
        </div>
      </Group>

      <noscript>
        <button
          type="submit"
          className="rounded-lg border border-olive-300 px-3 py-1.5 text-sm text-olive-700 dark:border-olive-800 dark:text-olive-300"
        >
          Apply filters
        </button>
      </noscript>
    </form>
  )
}

function Chip({ name, label, checked, onPick }: { name: string; label: string; checked: boolean; onPick: () => void }) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="category"
        value={name}
        defaultChecked={checked}
        onChange={onPick}
        className="peer sr-only"
      />
      <span
        className={clsx(
          'block rounded-full px-3.5 py-1.5 text-sm transition-colors',
          'border border-olive-300 text-olive-700 dark:border-olive-800 dark:text-olive-300',
          'peer-checked:border-olive-950 peer-checked:bg-olive-950 peer-checked:text-white',
          'dark:peer-checked:border-white dark:peer-checked:bg-white dark:peer-checked:text-olive-950',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
          'peer-focus-visible:ring-offset-background',
        )}
      >
        {label}
      </span>
    </label>
  )
}
