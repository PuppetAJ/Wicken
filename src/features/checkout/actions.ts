'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { attachStripeSession, createPendingOrder, getOrderForUser, markOrderPaid } from '@/lib/db/queries/orders'
import { getCartIdForUser } from '@/lib/db/queries/cart'
import { requireUser } from '@/lib/auth/session'
import { env } from '@/lib/env'
import { stripe } from '@/lib/stripe'
import type { Order } from '@/lib/db/types'
import type Stripe from 'stripe'
import { succeeded, type ActionState } from '@/lib/action-state'

export type CheckoutState = ActionState<{ settled?: boolean }>

export async function startCheckout(): Promise<CheckoutState> {
  const user = await requireUser()
  if (!stripe) return { error: 'Payments are not configured on this deployment.' }

  const cartId = await getCartIdForUser(user.id)
  if (!cartId) return { error: 'Your cart is empty.' }

  let url: string | null = null
  try {
    const order = await createPendingOrder(user.id, cartId)

    const session = await payFor(stripe, order, user.email, `${env.APP_URL}/cart`)
    await attachStripeSession(order.id, session.id)
    url = session.url
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'Cart is empty') return { error: 'Your cart is empty.' }
    if (message.startsWith('Not enough stock')) return { error: `${message}. Adjust the quantity and try again.` }
    console.error('checkout failed', error)
    return { error: 'Checkout could not be started. Nothing has been charged.' }
  }

  if (!url) return { error: 'Stripe did not return a payment page.' }
  redirect(url)
}

async function payFor(
  client: Stripe,
  order: Order,
  email: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  return client.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: item.unit_price_cents,
        product_data: {
          name: item.product_name,
          images: item.image_url ? [new URL(item.image_url, env.APP_URL).toString()] : undefined,
        },
      },
    })),
    success_url: `${env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { orderId: String(order.id) },
  })
}

export async function resumePayment(orderId: number): Promise<CheckoutState> {
  const user = await requireUser()
  if (!stripe) return { error: 'Payments are not configured on this deployment.' }

  const order = await getOrderForUser(orderId, user.id)
  if (!order) return { error: 'That order could not be found.' }
  if (order.status !== 'pending') return { error: 'That order is not awaiting payment.' }

  let url: string | null = null
  try {
    if (order.stripe_session_id) {
      const old = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      if (old.payment_status === 'paid') {
        const settled = await markOrderPaid(order.stripe_session_id)
        revalidatePath('/', 'layout')
        return { ...succeeded(), settled }
      }
      if (old.status === 'open') await stripe.checkout.sessions.expire(order.stripe_session_id)
    }

    const session = await payFor(stripe, order, user.email, `${env.APP_URL}/account/orders`)
    await attachStripeSession(order.id, session.id)
    url = session.url
  } catch (error) {
    console.error('resuming payment failed', error)
    return { error: 'That payment page could not be reopened. Nothing has been charged.' }
  }

  if (!url) return { error: 'Stripe did not return a payment page.' }
  redirect(url)
}
