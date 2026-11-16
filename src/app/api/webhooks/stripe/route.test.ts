import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { pool } from '../../../../lib/db/pool.ts'
import { insertProduct, insertUser, resetDatabase } from '../../../../lib/db/test-support.ts'
import { addCartItem, createCart } from '../../../../lib/db/queries/cart.ts'
import { attachStripeSession, createPendingOrder } from '../../../../lib/db/queries/orders.ts'
import { env } from '../../../../lib/env.ts'
import { stripe } from '../../../../lib/stripe.ts'
import { receiveStripeEvent } from '../../../../lib/stripe-webhook.ts'

after(() => pool.end())
beforeEach(async () => {
  await resetDatabase()
  await insertUser('user-1')
})

const secret = env.STRIPE_WEBHOOK_SECRET
const configured = Boolean(stripe && secret)

async function signed(body: unknown) {
  const payload = JSON.stringify(body)
  const header = await stripe!.webhooks.generateTestHeaderStringAsync({ payload, secret: secret! })
  return { payload, header }
}

const completed = (sessionId: string) => ({
  id: `evt_${sessionId}`,
  type: 'checkout.session.completed',
  data: { object: { id: sessionId, payment_status: 'paid' } },
})

async function pendingOrder(sessionId: string) {
  const cart = await createCart()
  const product = await insertProduct({ price_cents: 1000, stock_quantity: 10 })
  await addCartItem(cart, product, 3)
  const order = await createPendingOrder('user-1', cart)
  await attachStripeSession(order.id, sessionId)
  return { product, order }
}

const stockOf = async (id: number) => {
  const { rows } = await pool.query<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = $1', [
    id,
  ])
  return rows[0].stock_quantity
}
const statusOf = async (id: number) => {
  const { rows } = await pool.query<{ status: string }>('SELECT status FROM orders WHERE id = $1', [id])
  return rows[0].status
}

describe('the stripe webhook', { skip: configured ? false : 'Stripe keys are not configured' }, () => {
  it('refuses a request with no signature', async () => {
    const response = await receiveStripeEvent('{}', null)
    assert.equal(response.status, 400)
  })

  it('refuses a forged signature', async () => {
    const response = await receiveStripeEvent(JSON.stringify(completed('cs_test_forged')), 't=1,v1=deadbeef')
    assert.equal(response.status, 400)
  })

  it('refuses a body that was altered after signing', async () => {
    const { header } = await signed(completed('cs_test_tampered'))
    const altered = JSON.stringify(completed('cs_test_somebody_elses'))
    assert.equal((await receiveStripeEvent(altered, header)).status, 400)
  })

  it('marks the order paid and decrements stock', async () => {
    const { product, order } = await pendingOrder('cs_test_ok')

    const { payload, header } = await signed(completed('cs_test_ok'))
    const response = await receiveStripeEvent(payload, header)
    assert.equal(response.status, 200)
    assert.equal(await statusOf(order.id), 'paid')
    assert.equal(await stockOf(product), 7)
  })

  it('ignores a redelivery of the same event', async () => {
    const { product, order } = await pendingOrder('cs_test_replay')

    const { payload, header } = await signed(completed('cs_test_replay'))
    await receiveStripeEvent(payload, header)
    const second = await receiveStripeEvent(payload, header)

    assert.equal(second.status, 200, 'a replay is still acknowledged')
    assert.equal(await statusOf(order.id), 'paid')
    assert.equal(await stockOf(product), 7, 'stock was decremented once, not twice')
  })

  it('acknowledges an event it does not act on', async () => {
    const { payload, header } = await signed({ id: 'evt_other', type: 'payment_intent.created', data: { object: {} } })
    const response = await receiveStripeEvent(payload, header)
    assert.equal(response.status, 200, 'otherwise Stripe retries it forever')
  })
})
