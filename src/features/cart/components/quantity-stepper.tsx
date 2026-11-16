'use client'

import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'

export function QuantityStepper({
  quantity,
  max,
  min = 1,
  onChange,
  disabled,
  label,
}: {
  quantity: number
  max: number
  min?: number
  onChange: (quantity: number) => void
  disabled?: boolean
  label: string
}) {
  const step =
    'inline-flex size-8 items-center justify-center rounded-full text-olive-700 hover:bg-olive-950/10 disabled:opacity-40 disabled:hover:bg-transparent dark:text-olive-400 dark:hover:bg-white/10'

  const removes = min === 0 && quantity === 1

  return (
    <div className="inline-flex items-center rounded-full border border-olive-950/10 dark:border-white/15">
      <button
        type="button"
        className={step}
        aria-label={removes ? `Remove ${label} from the cart` : `Remove one ${label}`}
        disabled={disabled || quantity <= min}
        onClick={() => onChange(quantity - 1)}
      >
        {removes ? <Trash2Icon className="size-4" /> : <MinusIcon className="size-4" />}
      </button>
      <span aria-live="polite" className="min-w-8 text-center text-sm tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        className={step}
        aria-label={`Add one ${label}`}
        disabled={disabled || quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
