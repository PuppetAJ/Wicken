import 'server-only'
import { pool, transaction } from '../pool.ts'
import type { Order } from '../types.ts'

export const orderItemsJson = `COALESCE(
  json_agg(
    json_build_object(
      'product_id', oi.product_id, 'product_name', oi.product_name, 'product_slug', oi.product_slug,
      'image_url', oi.image_url, 'quantity', oi.quantity, 'unit_price_cents', oi.unit_price_cents
    ) ORDER BY oi.id
  ) FILTER (WHERE oi.id IS NOT NULL), '[]'
) AS items`

const withItems = `
  SELECT o.*, ${orderItemsJson}
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
`

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const { rows } = await pool.query<Order>(
    `${withItems} WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
    [userId],
  )
  return rows
}

export async function getOrderForUser(orderId: number, userId: string): Promise<Order | null> {
  const { rows } = await pool.query<Order>(`${withItems} WHERE o.id = $1 AND o.user_id = $2 GROUP BY o.id`, [
    orderId,
    userId,
  ])
  return rows[0] ?? null
}

export async function getOrderByStripeSession(sessionId: string, userId: string): Promise<Order | null> {
  const { rows } = await pool.query<Order>(
    `${withItems} WHERE o.stripe_session_id = $1 AND o.user_id = $2 GROUP BY o.id`,
    [sessionId, userId],
  )
  return rows[0] ?? null
}

export async function createPendingOrder(userId: string, cartId: string): Promise<Order> {
  return transaction(async (client) => {
    const { rows: items } = await client.query<{
      product_id: number
      name: string
      slug: string
      image_url: string | null
      price_cents: number
      stock_quantity: number
      quantity: number
    }>(
      `SELECT p.id AS product_id, p.name, p.slug, p.image_url,
              COALESCE(p.sale_price_cents, p.price_cents) AS price_cents, p.stock_quantity, ci.quantity
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       FOR UPDATE OF p`,
      [cartId],
    )

    if (items.length === 0) throw new Error('Cart is empty')

    const short = items.find((item) => item.quantity > item.stock_quantity)
    if (short) throw new Error(`Not enough stock for ${short.name}`)

    const total = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)

    const { rows: orderRows } = await client.query<{ id: number }>(
      'INSERT INTO orders (user_id, total_cents) VALUES ($1, $2) RETURNING id',
      [userId, total],
    )
    const orderId = orderRows[0].id

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_slug, image_url, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.product_id, item.name, item.slug, item.image_url, item.quantity, item.price_cents],
      )
    }

    const { rows } = await client.query<Order>(`${withItems} WHERE o.id = $1 GROUP BY o.id`, [orderId])
    return rows[0]
  })
}

export async function attachStripeSession(orderId: number, sessionId: string): Promise<void> {
  await pool.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [sessionId, orderId])
}

export async function markOrderPaid(sessionId: string): Promise<boolean> {
  return transaction(async (client) => {
    const { rows } = await client.query<{ id: number; user_id: string }>(
      `UPDATE orders SET status = 'paid', paid_at = now()
       WHERE stripe_session_id = $1 AND status = 'pending'
       RETURNING id, user_id`,
      [sessionId],
    )
    if (rows.length === 0) return false

    const { id: orderId, user_id: userId } = rows[0]
    await client.query(
      `UPDATE products p
       SET stock_quantity = GREATEST(p.stock_quantity - oi.quantity, 0)
       FROM order_items oi
       WHERE oi.order_id = $1 AND oi.product_id = p.id`,
      [orderId],
    )
    await client.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)', [userId])
    return true
  })
}
