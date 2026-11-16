'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/elements/button'
import { resumePayment, type CheckoutState } from '../actions'

export function ResumePayment({ orderId, size = 'md' }: { orderId: number; size?: 'md' | 'lg' }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(() => resumePayment(orderId), undefined)
  const router = useRouter()

  useEffect(() => {
    if (state?.error) toast.error(state.error)
    if (!state?.ok) return
    if (state.settled) toast.success('Payment confirmed', { description: 'This order is now marked as paid.' })
    else toast('Payment received', { description: 'Please allow a moment for it to show on this order.' })
    router.refresh()
  }, [state, router])

  return (
    <form action={action}>
      <Button type="submit" size={size} disabled={pending}>
        {pending ? 'Opening Stripe…' : 'Complete payment'}
      </Button>
    </form>
  )
}
