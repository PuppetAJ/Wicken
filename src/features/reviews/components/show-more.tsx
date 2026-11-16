'use client'

import { Children, useState, type ReactNode } from 'react'

export function ShowMore({ initial, noun, children }: { initial: number; noun: string; children: ReactNode }) {
  const items = Children.toArray(children)
  const [all, setAll] = useState(false)
  const hidden = items.length - initial

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-6">{all ? items : items.slice(0, initial)}</ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          className="self-start text-sm text-olive-950 underline underline-offset-4 hover:text-olive-700 dark:text-white dark:hover:text-olive-300"
        >
          {all ? 'Show fewer' : `Show all ${items.length} ${noun}`}
        </button>
      )}
    </div>
  )
}
