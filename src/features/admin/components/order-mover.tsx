'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/elements/button'
import { control } from '@/components/elements/control'
import { orderStatusLabels } from '@/components/elements/order-status'
import type { OrderStatus } from '@/lib/db/types'
import { moveOrder, type AdminState } from '../actions'

export function OrderMover({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(moveOrder, undefined)

  useEffect(() => {
    if (state?.ok) toast.success('Order updated')
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={orderId} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-olive-600 dark:text-olive-400">Status</span>
        <select name="status" defaultValue={status} className={`${control} py-1.5 pr-8 pl-3`}>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
      <p className="w-full text-xs text-olive-600 dark:text-olive-400">
        Refunds are disabled on the demo. Marking an order paid here does not charge anybody.
      </p>
    </form>
  )
}
