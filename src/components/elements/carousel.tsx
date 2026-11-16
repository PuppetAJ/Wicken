'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

const arrow =
  'inline-flex size-9 items-center justify-center rounded-full border border-olive-950/10 text-olive-700 transition-colors hover:bg-olive-950/5 disabled:opacity-30 disabled:hover:bg-transparent dark:border-white/15 dark:text-olive-400 dark:hover:bg-white/10'

export function Carousel({
  title,
  children,
  itemClassName = '',
  label,
  previousLabel = 'Previous',
  nextLabel = 'Next',
}: {
  title?: ReactNode
  children: ReactNode
  itemClassName?: string
  label?: string
  previousLabel?: string
  nextLabel?: string
}) {
  const rail = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  function measure() {
    const element = rail.current
    if (!element) return
    setAtStart(element.scrollLeft <= 1)
    setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 1)
  }

  useEffect(() => {
    measure()
    const element = rail.current
    if (!element) return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  function page(direction: -1 | 1) {
    const element = rail.current
    if (!element) return
    const item = element.firstElementChild?.clientWidth ?? element.clientWidth
    const gap = 24
    const perPage = Math.max(1, Math.round(element.clientWidth / (item + gap)))
    element.scrollBy({ left: direction * perPage * (item + gap), behavior: 'smooth' })
  }

  const hasOverflow = !(atStart && atEnd)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {title}
        {hasOverflow && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => page(-1)}
              disabled={atStart}
              aria-label={previousLabel}
              className={arrow}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button type="button" onClick={() => page(1)} disabled={atEnd} aria-label={nextLabel} className={arrow}>
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
      <ul
        ref={rail}
        onScroll={measure}
        aria-label={label}
        className="-mx-6 flex snap-x snap-mandatory scroll-px-6 scroll-hint gap-6 overflow-x-auto scroll-smooth px-6 pb-2 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {Children.toArray(children).map((child, index) => (
          <li key={index} className={`shrink-0 snap-start ${itemClassName}`}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  )
}
