import 'server-only'
import { markOrderPaid } from './db/queries/orders.ts'
import { env } from './env.ts'
import { stripe } from './stripe.ts'

export async function receiveStripeEvent(rawBody: string, signature: string | null): Promise<Response> {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return new Response('Stripe is not configured', { status: 503 })
  if (!signature) return new Response('Missing signature', { status: 400 })

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    if (session.payment_status === 'paid') {
      const applied = await markOrderPaid(session.id)
      console.log(`stripe ${event.id}: ${applied ? 'order marked paid' : 'already handled, ignored'}`)
    }
  }

  // 200 for anything signed, or Stripe retries events this app does not act on.
  return Response.json({ received: true })
}
