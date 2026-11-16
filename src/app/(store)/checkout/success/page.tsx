import { Suspense } from 'react'
import { Container } from '@/components/elements/container'
import { Heading } from '@/components/elements/heading'
import { Text } from '@/components/elements/text'
import { ButtonLink } from '@/components/elements/button'
import { Skeleton } from '@/components/ui/skeleton'
import { requireUser } from '@/lib/auth/session'
import { getOrderByStripeSession, markOrderPaid } from '@/lib/db/queries/orders'
import { stripe } from '@/lib/stripe'
import { OrderSummary } from '@/features/checkout/components/order-summary'
import { TrackPurchase } from '@/components/analytics'

export const metadata = { title: 'Order confirmed' }

export const instant = false

export default async function Page({ searchParams }: PageProps<'/checkout/success'>) {
  const sessionId = (await searchParams).session_id

  return (
    <Container className="flex flex-col gap-8 py-16">
      <Heading>Thank you</Heading>
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-2xl rounded-xl" />}>
        <Confirmation sessionId={typeof sessionId === 'string' ? sessionId : undefined} />
      </Suspense>
    </Container>
  )
}

async function Confirmation({ sessionId }: { sessionId?: string }) {
  const user = await requireUser()
  let order = sessionId ? await getOrderByStripeSession(sessionId, user.id) : null

  if (order?.status === 'pending' && sessionId && stripe) {
    const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null)
    if (session?.payment_status === 'paid' && (await markOrderPaid(sessionId))) {
      order = await getOrderByStripeSession(sessionId, user.id)
    }
  }

  if (!order) {
    return (
      <div className="flex flex-col items-start gap-6">
        <Text size="lg" className="max-w-xl">
          <p>We could not find that order. If you have just paid, it may take a moment to appear.</p>
        </Text>
        <ButtonLink href="/account/orders" size="lg">
          Your orders
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <TrackPurchase orderId={order.id} />
      <Text size="lg">
        <p>
          {order.status === 'paid'
            ? 'Your order is confirmed. Nothing was really charged, because this is a demo.'
            : 'Your payment is still settling. This page will show it as paid once Stripe confirms.'}
        </p>
      </Text>
      <OrderSummary order={order} />
      <ButtonLink href="/account/orders" size="lg" className="self-start">
        All your orders
      </ButtonLink>
    </div>
  )
}
